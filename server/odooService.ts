import { ENV } from "./_core/env";
import { odooClient, type OdooDomain, type OdooId, type OdooMany2One } from "./odooClient";

export type OdooClientSummary = {
  id: number;
  name: string;
  phone: string;
  zone: string;
  email: string;
  active: boolean;
};

export type OdooProductStock = {
  id: number;
  name: string;
  code: string;
  barcode: string;
  listPrice: number;
  cost: number;
  quantityOnHand: number;
  forecastQuantity: number;
  uom: string;
};

export type OdooStockSummary = {
  products: OdooProductStock[];
  totalQuantityOnHand: number;
  totalSalesValue: number;
  packProductId: number | null;
};

export type OdooSaleSummary = {
  id: number;
  name: string;
  date: string;
  clientId: number | null;
  clientName: string;
  quantity: number;
  state: string;
  invoiceStatus: string;
  amountTotal: number;
  paymentMode: "cash" | "credit" | "unknown";
};

type PartnerRecord = {
  id: number;
  name: string | false;
  phone: string | false;
  mobile: string | false;
  city: string | false;
  email: string | false;
  active: boolean;
};

type ProductRecord = {
  id: number;
  display_name: string | false;
  default_code: string | false;
  barcode: string | false;
  list_price: number | false;
  standard_price: number | false;
  qty_available: number | false;
  virtual_available: number | false;
  uom_id: OdooMany2One;
};

type SaleRecord = {
  id: number;
  name: string | false;
  date_order: string | false;
  partner_id: OdooMany2One;
  state: string | false;
  invoice_status: string | false;
  amount_total: number | false;
  client_order_ref: string | false;
  order_line: OdooId[] | false;
};

type SaleLineRecord = {
  id: number;
  order_id: OdooMany2One;
  product_uom_qty: number | false;
};

function m2oId(value: OdooMany2One): number | null {
  return Array.isArray(value) ? value[0] : null;
}

function m2oName(value: OdooMany2One): string {
  return Array.isArray(value) ? value[1] : "";
}

function text(value: string | false | null | undefined): string {
  return value || "";
}

function numberValue(value: number | false | null | undefined): number {
  return typeof value === "number" ? value : 0;
}

function paymentModeFromRef(value: string | false): OdooSaleSummary["paymentMode"] {
  const normalized = text(value).toLowerCase();
  if (normalized.includes("cash")) return "cash";
  if (normalized.includes("credit")) return "credit";
  return "unknown";
}

export async function checkOdooConnection() {
  if (!odooClient.isConfigured()) {
    return {
      configured: false,
      authenticated: false,
      uid: null,
      url: ENV.odooUrl || null,
      db: ENV.odooDb || null,
    };
  }

  const uid = await odooClient.authenticate(true);
  return {
    configured: true,
    authenticated: true,
    uid,
    url: ENV.odooUrl,
    db: ENV.odooDb,
  };
}

export async function listClients(input: { search?: string; limit?: number } = {}): Promise<OdooClientSummary[]> {
  const domain: OdooDomain = [["active", "=", true]];
  if (input.search) {
    domain.push(["name", "ilike", input.search]);
  }

  const records = await odooClient.searchRead<PartnerRecord>(
    "res.partner",
    domain,
    ["name", "phone", "mobile", "city", "email", "active"],
    { limit: input.limit ?? 100, order: "name asc" },
  );

  return records.map((partner) => ({
    id: partner.id,
    name: text(partner.name),
    phone: text(partner.phone) || text(partner.mobile),
    zone: text(partner.city),
    email: text(partner.email),
    active: partner.active,
  }));
}

export async function createClient(input: {
  name: string;
  phone?: string;
  zone?: string;
  email?: string;
}): Promise<OdooClientSummary> {
  const id = await odooClient.create("res.partner", {
    name: input.name,
    phone: input.phone || false,
    city: input.zone || false,
    email: input.email || false,
  });

  const [client] = await listClients({ search: input.name, limit: 1 });
  return client ?? {
    id,
    name: input.name,
    phone: input.phone ?? "",
    zone: input.zone ?? "",
    email: input.email ?? "",
    active: true,
  };
}

export async function archiveClient(id: OdooId): Promise<{ success: true }> {
  await odooClient.write("res.partner", [id], { active: false });
  return { success: true };
}

export async function listProductStock(input: { search?: string; limit?: number } = {}): Promise<OdooProductStock[]> {
  const domain: OdooDomain = [["is_storable", "=", true], ["active", "=", true]];
  if (input.search) {
    domain.push(["display_name", "ilike", input.search]);
  }

  const records = await odooClient.searchRead<ProductRecord>(
    "product.product",
    domain,
    [
      "display_name",
      "default_code",
      "barcode",
      "list_price",
      "standard_price",
      "qty_available",
      "virtual_available",
      "uom_id",
    ],
    { limit: input.limit ?? 100, order: "display_name asc" },
  );

  return records.map((product) => ({
    id: product.id,
    name: text(product.display_name),
    code: text(product.default_code),
    barcode: text(product.barcode),
    listPrice: numberValue(product.list_price),
    cost: numberValue(product.standard_price),
    quantityOnHand: numberValue(product.qty_available),
    forecastQuantity: numberValue(product.virtual_available),
    uom: m2oName(product.uom_id),
  }));
}

export async function getStockSummary(): Promise<OdooStockSummary> {
  const products = await listProductStock();
  const packProductId = await resolvePackProductId(false);

  return {
    products,
    totalQuantityOnHand: products.reduce((sum, product) => sum + product.quantityOnHand, 0),
    totalSalesValue: products.reduce(
      (sum, product) => sum + product.quantityOnHand * product.listPrice,
      0,
    ),
    packProductId,
  };
}

export async function resolvePackProductId(throwIfMissing = true): Promise<number | null> {
  const configuredId = Number.parseInt(ENV.odooPackProductId, 10);
  if (Number.isFinite(configuredId) && configuredId > 0) {
    return configuredId;
  }

  const byCode = await odooClient.search(
    "product.product",
    [["default_code", "=", ENV.odooPackProductCode]],
    { limit: 1 },
  );
  if (byCode[0]) return byCode[0];

  const byName = await odooClient.search(
    "product.product",
    [["display_name", "ilike", "sachet"]],
    { limit: 1 },
  );
  if (byName[0]) return byName[0];

  if (throwIfMissing) {
    throw new Error(
      `No AquaSachet pack product found in Odoo. Set ODOO_PACK_PRODUCT_ID or create a storable product with default code ${ENV.odooPackProductCode}.`,
    );
  }
  return null;
}

export async function recordFinishedPacks(input: {
  quantity: number;
  productId?: number;
}): Promise<{ productId: number; previousQuantity: number; newQuantity: number }> {
  const productId = input.productId ?? (await resolvePackProductId());
  if (!productId) {
    throw new Error("Missing Odoo product id for production.");
  }

  const [product] = await odooClient.read<ProductRecord>(
    "product.product",
    [productId],
    ["qty_available"],
  );
  const previousQuantity = numberValue(product?.qty_available);
  const newQuantity = previousQuantity + input.quantity;

  await odooClient.write("product.product", [productId], {
    qty_available: newQuantity,
  });

  return { productId, previousQuantity, newQuantity };
}

async function findOrCreatePartner(input: { partnerId?: number; partnerName?: string }): Promise<number> {
  if (input.partnerId) return input.partnerId;
  const name = input.partnerName?.trim();
  if (!name) throw new Error("A partnerId or partnerName is required.");

  const existing = await odooClient.search("res.partner", [["name", "=", name]], { limit: 1 });
  if (existing[0]) return existing[0];

  return odooClient.create("res.partner", { name });
}

export async function listSales(input: { limit?: number } = {}): Promise<OdooSaleSummary[]> {
  const records = await odooClient.searchRead<SaleRecord>(
    "sale.order",
    [],
    [
      "name",
      "date_order",
      "partner_id",
      "state",
      "invoice_status",
      "amount_total",
      "client_order_ref",
      "order_line",
    ],
    { limit: input.limit ?? 100, order: "date_order desc" },
  );
  const lineIds = records.flatMap((sale) => (Array.isArray(sale.order_line) ? sale.order_line : []));
  const lines =
    lineIds.length > 0
      ? await odooClient.read<SaleLineRecord>("sale.order.line", lineIds, [
          "order_id",
          "product_uom_qty",
        ])
      : [];
  const quantityBySaleId = new Map<number, number>();

  lines.forEach((line) => {
    const orderId = m2oId(line.order_id);
    if (!orderId) return;
    quantityBySaleId.set(
      orderId,
      (quantityBySaleId.get(orderId) ?? 0) + numberValue(line.product_uom_qty),
    );
  });

  return records.map((sale) => ({
    id: sale.id,
    name: text(sale.name),
    date: text(sale.date_order).slice(0, 10),
    clientId: m2oId(sale.partner_id),
    clientName: m2oName(sale.partner_id),
    quantity: quantityBySaleId.get(sale.id) ?? 0,
    state: text(sale.state),
    invoiceStatus: text(sale.invoice_status),
    amountTotal: numberValue(sale.amount_total),
    paymentMode: paymentModeFromRef(sale.client_order_ref),
  }));
}

export async function createSale(input: {
  partnerId?: number;
  partnerName?: string;
  productId?: number;
  quantity: number;
  priceUnit?: number;
  paymentMode: "cash" | "credit";
  confirm?: boolean;
}): Promise<OdooSaleSummary> {
  const partnerId = await findOrCreatePartner(input);
  const productId = input.productId ?? (await resolvePackProductId());
  if (!productId) {
    throw new Error("Missing Odoo product id for sale.");
  }

  const lineValues: Record<string, unknown> = {
    product_id: productId,
    product_uom_qty: input.quantity,
  };

  if (input.priceUnit !== undefined) {
    lineValues.price_unit = input.priceUnit;
  }

  const id = await odooClient.create("sale.order", {
    partner_id: partnerId,
    client_order_ref: `AquaSachet mobile ${input.paymentMode}`,
    order_line: [[0, 0, lineValues]],
  });

  if (input.confirm) {
    await odooClient.action("sale.order", "action_confirm", [id]);
  }

  const [sale] = await odooClient.read<SaleRecord>(
    "sale.order",
    [id],
    ["name", "date_order", "partner_id", "state", "invoice_status", "amount_total", "client_order_ref"],
  );

  return {
    id,
    name: text(sale?.name),
    date: text(sale?.date_order).slice(0, 10),
    clientId: m2oId(sale?.partner_id ?? false),
    clientName: m2oName(sale?.partner_id ?? false),
    quantity: input.quantity,
    state: text(sale?.state),
    invoiceStatus: text(sale?.invoice_status),
    amountTotal: numberValue(sale?.amount_total),
    paymentMode: paymentModeFromRef(sale?.client_order_ref ?? false),
  };
}
