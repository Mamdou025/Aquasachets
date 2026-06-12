import { ENV } from "./_core/env";

export type OdooId = number;
export type OdooDomain = unknown[];
export type OdooMany2One = false | [number, string];

type OdooConfig = {
  url: string;
  db: string;
  username: string;
  password: string;
};

type JsonRpcResponse<T> = {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: {
      name?: string;
      message?: string;
      debug?: string;
    };
  };
};

type JsonRpcError = NonNullable<JsonRpcResponse<unknown>["error"]>;

export class OdooConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OdooConfigurationError";
  }
}

export class OdooRpcError extends Error {
  readonly code: number;
  readonly data?: JsonRpcError["data"];

  constructor(error: JsonRpcError) {
    super(error.data?.message || error.message || "Odoo RPC request failed");
    this.name = "OdooRpcError";
    this.code = error.code;
    this.data = error.data;
  }
}

function getConfig(): OdooConfig {
  const url = ENV.odooUrl.replace(/\/+$/, "");
  const config = {
    url,
    db: ENV.odooDb,
    username: ENV.odooUsername,
    password: ENV.odooPassword,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new OdooConfigurationError(
      `Odoo is not configured. Missing: ${missing.join(", ")}.`,
    );
  }

  return config;
}

function extractSessionCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  return setCookie.match(/session_id=[^;]+/)?.[0] ?? null;
}

let nextRpcId = 1;

export class OdooClient {
  private sessionCookie: string | null = null;
  private uid: number | null = null;

  isConfigured(): boolean {
    return Boolean(ENV.odooUrl && ENV.odooDb && ENV.odooUsername && ENV.odooPassword);
  }

  clearSession(): void {
    this.sessionCookie = null;
    this.uid = null;
  }

  async authenticate(force = false): Promise<number> {
    if (!force && this.sessionCookie && this.uid) {
      return this.uid;
    }

    const config = getConfig();
    const result = await this.jsonRpc<{ uid?: number }>(
      "/web/session/authenticate",
      {
        db: config.db,
        login: config.username,
        password: config.password,
        base_location: config.url,
      },
      false,
    );

    if (!result.uid) {
      this.clearSession();
      throw new OdooRpcError({
        code: 401,
        message: "Odoo authentication failed",
        data: { message: "Odoo returned no uid. Check ODOO_DB, ODOO_USERNAME, and ODOO_PASSWORD." },
      });
    }

    this.uid = result.uid;
    return result.uid;
  }

  async callKw<T>(
    model: string,
    method: string,
    args: unknown[] = [],
    kwargs: Record<string, unknown> = {},
  ): Promise<T> {
    await this.authenticate();

    try {
      return await this.jsonRpc<T>(
        "/web/dataset/call_kw",
        { model, method, args, kwargs },
        true,
      );
    } catch (error) {
      if (error instanceof OdooRpcError && this.shouldRetryWithFreshSession(error)) {
        await this.authenticate(true);
        return this.jsonRpc<T>(
          "/web/dataset/call_kw",
          { model, method, args, kwargs },
          true,
        );
      }
      throw error;
    }
  }

  searchRead<T>(
    model: string,
    domain: OdooDomain = [],
    fields: string[] = [],
    options: { limit?: number; offset?: number; order?: string; context?: Record<string, unknown> } = {},
  ): Promise<T[]> {
    const { context, ...kwargs } = options;
    return this.callKw<T[]>(model, "search_read", [domain], {
      fields,
      ...kwargs,
      ...(context ? { context } : {}),
    });
  }

  search(
    model: string,
    domain: OdooDomain = [],
    options: { limit?: number; offset?: number; order?: string } = {},
  ): Promise<OdooId[]> {
    return this.callKw<OdooId[]>(model, "search", [domain], options);
  }

  read<T>(model: string, ids: OdooId[], fields: string[] = []): Promise<T[]> {
    return this.callKw<T[]>(model, "read", [ids], { fields });
  }

  create(model: string, values: Record<string, unknown>): Promise<OdooId> {
    return this.callKw<OdooId>(model, "create", [values]);
  }

  write(model: string, ids: OdooId[], values: Record<string, unknown>): Promise<boolean> {
    return this.callKw<boolean>(model, "write", [ids, values]);
  }

  action<T>(model: string, method: string, ids: OdooId[], kwargs: Record<string, unknown> = {}): Promise<T> {
    return this.callKw<T>(model, method, [ids], kwargs);
  }

  private async jsonRpc<T>(
    path: string,
    params: Record<string, unknown>,
    includeSession: boolean,
  ): Promise<T> {
    const config = getConfig();
    const response = await fetch(`${config.url}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(includeSession && this.sessionCookie ? { Cookie: this.sessionCookie } : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params,
        id: nextRpcId++,
      }),
    });

    const cookie = extractSessionCookie(response.headers.get("set-cookie"));
    if (cookie) {
      this.sessionCookie = cookie;
    }

    if (!response.ok) {
      throw new OdooRpcError({
        code: response.status,
        message: `Odoo HTTP ${response.status}`,
        data: { message: await response.text() },
      });
    }

    const payload = (await response.json()) as JsonRpcResponse<T>;
    if (payload.error) {
      throw new OdooRpcError(payload.error);
    }
    return payload.result as T;
  }

  private shouldRetryWithFreshSession(error: OdooRpcError): boolean {
    const text = `${error.message} ${error.data?.name ?? ""} ${error.data?.debug ?? ""}`.toLowerCase();
    return text.includes("session") || text.includes("accessdenied") || text.includes("access denied");
  }
}

export const odooClient = new OdooClient();
