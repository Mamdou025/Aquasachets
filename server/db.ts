import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import * as schema from "../drizzle/schema";
import type { InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";

const DB_FILE = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : path.resolve(process.cwd(), "data/aquasachet.db");

// Ensure the data directory exists before libsql tries to open the file
function ensureDataDir() {
  if (DB_FILE.startsWith("file:") || !DB_FILE.includes("://")) {
    const filePath = DB_FILE.replace(/^file:/, "");
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

const DB_URL = DB_FILE.startsWith("libsql://") || DB_FILE.startsWith("http")
  ? DB_FILE
  : `file:${DB_FILE.replace(/^file:/, "")}`;

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  ensureDataDir();
  const client = createClient({ url: DB_URL });
  _db = drizzle(client, { schema });
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = getDb();
  const existing = await db.select().from(schema.users).where(eq(schema.users.openId, user.openId)).limit(1);
  const now = new Date().toISOString();
  if (existing.length > 0) {
    await db.update(schema.users)
      .set({ name: user.name, email: user.email, updatedAt: now, lastSignedIn: now })
      .where(eq(schema.users.openId, user.openId));
  } else {
    const role = user.openId === ENV.ownerOpenId ? "admin" : "user";
    await db.insert(schema.users).values({ ...user, role, lastSignedIn: now, createdAt: now, updatedAt: now });
  }
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  const result = await db.select().from(schema.users).where(eq(schema.users.openId, openId)).limit(1);
  return result[0] ?? undefined;
}

// ─── Bootstrap: create tables if missing ─────────────────────────────────────

export async function bootstrapDb() {
  const db = getDb();
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT NOT NULL UNIQUE, name TEXT, email TEXT,
      loginMethod TEXT, role TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      lastSignedIn TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, zone TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (date('now'))
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS commerciaux (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '', zone TEXT NOT NULL DEFAULT ''
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS production_entries (
      id TEXT PRIMARY KEY, date TEXT NOT NULL, quantity INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS sale_entries (
      id TEXT PRIMARY KEY, date TEXT NOT NULL,
      clientId TEXT NOT NULL DEFAULT '', clientName TEXT NOT NULL,
      quantity INTEGER NOT NULL, mode TEXT NOT NULL,
      commercial TEXT NOT NULL DEFAULT '', amount REAL NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS expense_entries (
      id TEXT PRIMARY KEY, date TEXT NOT NULL, category TEXT NOT NULL,
      designation TEXT NOT NULL, amount REAL NOT NULL,
      type TEXT NOT NULL DEFAULT '', supplier TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS tournee_entries (
      id TEXT PRIMARY KEY, date TEXT NOT NULL, livreur TEXT NOT NULL,
      sortis INTEGER NOT NULL, rendus INTEGER NOT NULL, vendus INTEGER NOT NULL,
      cashAttendu REAL NOT NULL, cashRemis REAL NOT NULL, ecart REAL NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS recovery_entries (
      id TEXT PRIMARY KEY, saleId TEXT NOT NULL DEFAULT '',
      clientName TEXT NOT NULL, amount REAL NOT NULL, date TEXT NOT NULL,
      status TEXT NOT NULL, datePaiement TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS caisse_entries (
      id TEXT PRIMARY KEY, date TEXT NOT NULL UNIQUE,
      soldeInitial REAL NOT NULL, recettes REAL NOT NULL,
      recouvrement REAL NOT NULL, depenses REAL NOT NULL, soldeFin REAL NOT NULL
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL
    )
  `);
}
