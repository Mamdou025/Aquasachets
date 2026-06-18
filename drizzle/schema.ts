import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
  lastSignedIn: text("lastSignedIn").default(sql`(datetime('now'))`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Clients ─────────────────────────────────────────────────────────────────

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  zone: text("zone").default("").notNull(),
  phone: text("phone").default("").notNull(),
  email: text("email").default("").notNull(),
  createdAt: text("createdAt").default(sql`(date('now'))`).notNull(),
});

export type DbClient = typeof clients.$inferSelect;

// ─── Commerciaux ─────────────────────────────────────────────────────────────

export const commerciaux = sqliteTable("commerciaux", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").default("").notNull(),
  zone: text("zone").default("").notNull(),
});

export type DbCommercial = typeof commerciaux.$inferSelect;

// ─── Production ──────────────────────────────────────────────────────────────

export const productionEntries = sqliteTable("production_entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

export type DbProductionEntry = typeof productionEntries.$inferSelect;

// ─── Sales ───────────────────────────────────────────────────────────────────

export const saleEntries = sqliteTable("sale_entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  clientId: text("clientId").default("").notNull(),
  clientName: text("clientName").notNull(),
  quantity: integer("quantity").notNull(),
  mode: text("mode", { enum: ["cash", "credit"] }).notNull(),
  commercial: text("commercial").default("").notNull(),
  amount: real("amount").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

export type DbSaleEntry = typeof saleEntries.$inferSelect;

// ─── Expenses ────────────────────────────────────────────────────────────────

export const expenseEntries = sqliteTable("expense_entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  category: text("category", {
    enum: ["Variable", "Fixe", "Distribution", "Ponctuel", "Amortissement"],
  }).notNull(),
  designation: text("designation").notNull(),
  amount: real("amount").notNull(),
  type: text("type").default("").notNull(),
  supplier: text("supplier").default("").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

export type DbExpenseEntry = typeof expenseEntries.$inferSelect;

// ─── Tournées ─────────────────────────────────────────────────────────────────

export const tourneeEntries = sqliteTable("tournee_entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  livreur: text("livreur").notNull(),
  sortis: integer("sortis").notNull(),
  rendus: integer("rendus").notNull(),
  vendus: integer("vendus").notNull(),
  cashAttendu: real("cashAttendu").notNull(),
  cashRemis: real("cashRemis").notNull(),
  ecart: real("ecart").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

export type DbTourneeEntry = typeof tourneeEntries.$inferSelect;

// ─── Recovery ────────────────────────────────────────────────────────────────

export const recoveryEntries = sqliteTable("recovery_entries", {
  id: text("id").primaryKey(),
  saleId: text("saleId").default("").notNull(),
  clientName: text("clientName").notNull(),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  status: text("status", { enum: ["en_cours", "paye", "en_retard"] }).notNull(),
  datePaiement: text("datePaiement"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

export type DbRecoveryEntry = typeof recoveryEntries.$inferSelect;

// ─── Caisse ───────────────────────────────────────────────────────────────────

export const caisseEntries = sqliteTable("caisse_entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull().unique(),
  soldeInitial: real("soldeInitial").notNull(),
  recettes: real("recettes").notNull(),
  recouvrement: real("recouvrement").notNull(),
  depenses: real("depenses").notNull(),
  soldeFin: real("soldeFin").notNull(),
});

export type DbCaisseEntry = typeof caisseEntries.$inferSelect;

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
