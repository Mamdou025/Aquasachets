import { eq, desc, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { DEFAULT_SETTINGS } from "../shared/settings";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ─── Settings helper ──────────────────────────────────────────────────────────

async function getSettingsFromDb() {
  const db = getDb();
  const rows = await db.select().from(schema.settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    prixVentePack: Number(map.prixVentePack ?? DEFAULT_SETTINGS.prixVentePack),
    coutRouleaux: Number(map.coutRouleaux ?? DEFAULT_SETTINGS.coutRouleaux),
    coutAntiscalant: Number(map.coutAntiscalant ?? DEFAULT_SETTINGS.coutAntiscalant),
    coutEau: Number(map.coutEau ?? DEFAULT_SETTINGS.coutEau),
    coutMembrane: Number(map.coutMembrane ?? DEFAULT_SETTINGS.coutMembrane),
    coutElectricite: Number(map.coutElectricite ?? DEFAULT_SETTINGS.coutElectricite),
    coutLoyer: Number(map.coutLoyer ?? DEFAULT_SETTINGS.coutLoyer),
    coutSalaires: Number(map.coutSalaires ?? DEFAULT_SETTINGS.coutSalaires),
    coutMaintenance: Number(map.coutMaintenance ?? DEFAULT_SETTINGS.coutMaintenance),
    commissionCommercial: Number(map.commissionCommercial ?? DEFAULT_SETTINGS.commissionCommercial),
    coutCarburant: Number(map.coutCarburant ?? DEFAULT_SETTINGS.coutCarburant),
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({

  // ── Clients ────────────────────────────────────────────────────────────────
  clients: router({
    list: publicProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const db = getDb();
        if (input?.search) {
          return db.select().from(schema.clients)
            .where(like(schema.clients.name, `%${input.search}%`))
            .orderBy(desc(schema.clients.createdAt));
        }
        return db.select().from(schema.clients).orderBy(desc(schema.clients.createdAt));
      }),
    create: publicProcedure
      .input(z.object({
        name: z.string().trim().min(1),
        zone: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const id = genId();
        await db.insert(schema.clients).values({
          id, name: input.name, zone: input.zone ?? "",
          phone: input.phone ?? "", email: input.email ?? "",
        });
        const rows = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
        return rows[0]!;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await getDb().delete(schema.clients).where(eq(schema.clients.id, input.id));
        return { success: true };
      }),
  }),

  // ── Commerciaux ────────────────────────────────────────────────────────────
  commerciaux: router({
    list: publicProcedure.query(async () =>
      getDb().select().from(schema.commerciaux)
    ),
    create: publicProcedure
      .input(z.object({ name: z.string().trim().min(1), phone: z.string().optional(), zone: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const id = genId();
        await db.insert(schema.commerciaux).values({ id, name: input.name, phone: input.phone ?? "", zone: input.zone ?? "" });
        const rows = await db.select().from(schema.commerciaux).where(eq(schema.commerciaux.id, id));
        return rows[0]!;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await getDb().delete(schema.commerciaux).where(eq(schema.commerciaux.id, input.id));
        return { success: true };
      }),
  }),

  // ── Production ─────────────────────────────────────────────────────────────
  production: router({
    list: publicProcedure.query(async () =>
      getDb().select().from(schema.productionEntries).orderBy(desc(schema.productionEntries.date))
    ),
    create: publicProcedure
      .input(z.object({ date: z.string(), quantity: z.number().positive() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const id = genId();
        await db.insert(schema.productionEntries).values({ id, date: input.date, quantity: input.quantity });
        const rows = await db.select().from(schema.productionEntries).where(eq(schema.productionEntries.id, id));
        return rows[0]!;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await getDb().delete(schema.productionEntries).where(eq(schema.productionEntries.id, input.id));
        return { success: true };
      }),
  }),

  // ── Sales ──────────────────────────────────────────────────────────────────
  sales: router({
    list: publicProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const db = getDb();
        if (input?.search) {
          const q = `%${input.search}%`;
          return db.select().from(schema.saleEntries)
            .where(or(
              like(schema.saleEntries.clientName, q),
              like(schema.saleEntries.commercial, q),
              like(schema.saleEntries.date, q),
              like(schema.saleEntries.mode, q),
            ))
            .orderBy(desc(schema.saleEntries.date));
        }
        return db.select().from(schema.saleEntries).orderBy(desc(schema.saleEntries.date));
      }),
    create: publicProcedure
      .input(z.object({
        date: z.string(),
        clientId: z.string().optional(),
        clientName: z.string().trim().min(1),
        quantity: z.number().positive(),
        mode: z.enum(["cash", "credit"]),
        commercial: z.string().optional(),
        amount: z.number().nonnegative(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const id = genId();
        await db.insert(schema.saleEntries).values({
          id, date: input.date, clientId: input.clientId ?? "",
          clientName: input.clientName, quantity: input.quantity,
          mode: input.mode, commercial: input.commercial ?? "", amount: input.amount,
        });
        const rows = await db.select().from(schema.saleEntries).where(eq(schema.saleEntries.id, id));
        return rows[0]!;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await getDb().delete(schema.saleEntries).where(eq(schema.saleEntries.id, input.id));
        return { success: true };
      }),
  }),

  // ── Expenses ───────────────────────────────────────────────────────────────
  expenses: router({
    list: publicProcedure.query(async () =>
      getDb().select().from(schema.expenseEntries).orderBy(desc(schema.expenseEntries.date))
    ),
    create: publicProcedure
      .input(z.object({
        date: z.string(),
        category: z.enum(["Variable", "Fixe", "Distribution", "Ponctuel", "Amortissement"]),
        designation: z.string().trim().min(1),
        amount: z.number().nonnegative(),
        type: z.string().optional(),
        supplier: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const id = genId();
        await db.insert(schema.expenseEntries).values({
          id, date: input.date, category: input.category,
          designation: input.designation, amount: input.amount,
          type: input.type ?? "", supplier: input.supplier ?? "",
        });
        const rows = await db.select().from(schema.expenseEntries).where(eq(schema.expenseEntries.id, id));
        return rows[0]!;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await getDb().delete(schema.expenseEntries).where(eq(schema.expenseEntries.id, input.id));
        return { success: true };
      }),
  }),

  // ── Tournées ───────────────────────────────────────────────────────────────
  tournees: router({
    list: publicProcedure.query(async () =>
      getDb().select().from(schema.tourneeEntries).orderBy(desc(schema.tourneeEntries.date))
    ),
    create: publicProcedure
      .input(z.object({
        date: z.string(),
        livreur: z.string().trim().min(1),
        sortis: z.number().nonnegative(),
        rendus: z.number().nonnegative(),
        vendus: z.number().nonnegative(),
        cashAttendu: z.number().nonnegative(),
        cashRemis: z.number().nonnegative(),
        ecart: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const id = genId();
        await db.insert(schema.tourneeEntries).values({ id, ...input });
        const rows = await db.select().from(schema.tourneeEntries).where(eq(schema.tourneeEntries.id, id));
        return rows[0]!;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await getDb().delete(schema.tourneeEntries).where(eq(schema.tourneeEntries.id, input.id));
        return { success: true };
      }),
  }),

  // ── Recovery ───────────────────────────────────────────────────────────────
  recovery: router({
    list: publicProcedure.query(async () =>
      getDb().select().from(schema.recoveryEntries).orderBy(desc(schema.recoveryEntries.date))
    ),
    create: publicProcedure
      .input(z.object({
        saleId: z.string().optional(),
        clientName: z.string().trim().min(1),
        amount: z.number().positive(),
        date: z.string(),
        status: z.enum(["en_cours", "paye", "en_retard"]),
        datePaiement: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const id = genId();
        await db.insert(schema.recoveryEntries).values({ id, saleId: input.saleId ?? "", ...input });
        const rows = await db.select().from(schema.recoveryEntries).where(eq(schema.recoveryEntries.id, id));
        return rows[0]!;
      }),
    updateStatus: publicProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["en_cours", "paye", "en_retard"]),
        datePaiement: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await getDb().update(schema.recoveryEntries)
          .set({ status: input.status, datePaiement: input.datePaiement })
          .where(eq(schema.recoveryEntries.id, input.id));
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await getDb().delete(schema.recoveryEntries).where(eq(schema.recoveryEntries.id, input.id));
        return { success: true };
      }),
  }),

  // ── Caisse ─────────────────────────────────────────────────────────────────
  caisse: router({
    list: publicProcedure.query(async () =>
      getDb().select().from(schema.caisseEntries).orderBy(desc(schema.caisseEntries.date))
    ),
    upsert: publicProcedure
      .input(z.object({
        date: z.string(),
        soldeInitial: z.number(),
        recettes: z.number(),
        recouvrement: z.number(),
        depenses: z.number(),
        soldeFin: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const id = genId();
        await db.run(sql`
          INSERT INTO caisse_entries (id, date, soldeInitial, recettes, recouvrement, depenses, soldeFin)
          VALUES (${id}, ${input.date}, ${input.soldeInitial}, ${input.recettes}, ${input.recouvrement}, ${input.depenses}, ${input.soldeFin})
          ON CONFLICT(date) DO UPDATE SET
            soldeInitial=excluded.soldeInitial, recettes=excluded.recettes,
            recouvrement=excluded.recouvrement, depenses=excluded.depenses,
            soldeFin=excluded.soldeFin
        `);
        const rows = await db.select().from(schema.caisseEntries).where(eq(schema.caisseEntries.date, input.date));
        return rows[0]!;
      }),
  }),

  // ── Settings ───────────────────────────────────────────────────────────────
  settings: router({
    get: publicProcedure.query(async () => getSettingsFromDb()),
    set: publicProcedure
      .input(z.object({
        prixVentePack: z.number().optional(),
        coutRouleaux: z.number().optional(),
        coutAntiscalant: z.number().optional(),
        coutEau: z.number().optional(),
        coutMembrane: z.number().optional(),
        coutElectricite: z.number().optional(),
        coutLoyer: z.number().optional(),
        coutSalaires: z.number().optional(),
        coutMaintenance: z.number().optional(),
        commissionCommercial: z.number().optional(),
        coutCarburant: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        for (const [key, value] of Object.entries(input)) {
          if (value === undefined) continue;
          await db.run(sql`
            INSERT INTO settings (key, value) VALUES (${key}, ${String(value)})
            ON CONFLICT(key) DO UPDATE SET value=excluded.value
          `);
        }
        return getSettingsFromDb();
      }),
  }),

  // ── Seed ───────────────────────────────────────────────────────────────────
  seed: router({
    status: publicProcedure.query(async () => {
      const rows = await getDb().select().from(schema.saleEntries);
      return { seeded: rows.length > 0, salesCount: rows.length };
    }),
    run: publicProcedure.mutation(async () => {
      await seedDatabase();
      return { success: true };
    }),
    reset: publicProcedure.mutation(async () => {
      const db = getDb();
      await db.run(sql`DELETE FROM sale_entries`);
      await db.run(sql`DELETE FROM production_entries`);
      await db.run(sql`DELETE FROM expense_entries`);
      await db.run(sql`DELETE FROM tournee_entries`);
      await db.run(sql`DELETE FROM recovery_entries`);
      await db.run(sql`DELETE FROM caisse_entries`);
      await db.run(sql`DELETE FROM clients`);
      await db.run(sql`DELETE FROM commerciaux`);
      await db.run(sql`DELETE FROM settings`);
      await seedDatabase();
      return { success: true };
    }),
  }),
});

// ─── Seed function ────────────────────────────────────────────────────────────

export async function seedDatabase() {
  const db = getDb();

  // Settings
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.run(sql`INSERT OR IGNORE INTO settings (key, value) VALUES (${key}, ${String(value)})`);
  }

  // Clients
  const clientsData = [
    { id: "cli_01", name: "Aliou Diallo", zone: "Dakar-Médina", phone: "77 123 45 67", email: "aliou@gmail.com" },
    { id: "cli_02", name: "Fatou Sow", zone: "Dakar-Plateau", phone: "76 234 56 78", email: "" },
    { id: "cli_03", name: "Moussa Ndiaye", zone: "Thiès", phone: "70 345 67 89", email: "" },
    { id: "cli_04", name: "Aissatou Diop", zone: "Saint-Louis", phone: "78 456 78 90", email: "" },
    { id: "cli_05", name: "Ibrahima Ba", zone: "Dakar-HLM", phone: "77 567 89 01", email: "" },
    { id: "cli_06", name: "Mariama Camara", zone: "Thiès", phone: "76 678 90 12", email: "" },
    { id: "cli_07", name: "Ousmane Niane", zone: "Dakar-Parcelles", phone: "70 789 01 23", email: "" },
    { id: "cli_08", name: "Kadiatou Bah", zone: "Rufisque", phone: "78 890 12 34", email: "" },
    { id: "cli_09", name: "Modou Diène", zone: "Pikine", phone: "77 901 23 45", email: "" },
    { id: "cli_10", name: "Rokhaya Fall", zone: "Dakar-Fass", phone: "76 012 34 56", email: "" },
    { id: "cli_11", name: "Amadou Kouyaté", zone: "Guédiawaye", phone: "70 123 45 67", email: "" },
    { id: "cli_12", name: "Coumba Sarr", zone: "Mbour", phone: "78 234 56 78", email: "" },
  ];
  for (const c of clientsData) {
    await db.run(sql`INSERT OR IGNORE INTO clients (id, name, zone, phone, email) VALUES (${c.id}, ${c.name}, ${c.zone}, ${c.phone}, ${c.email})`);
  }

  // Commerciaux
  const commerciauxData = [
    { id: "com_01", name: "Samba Diallo", phone: "77 111 22 33", zone: "Dakar-Nord" },
    { id: "com_02", name: "Ndèye Traoré", phone: "76 222 33 44", zone: "Dakar-Sud" },
    { id: "com_03", name: "Lamine Konaté", phone: "70 333 44 55", zone: "Banlieue" },
    { id: "com_04", name: "Astou Mbaye", phone: "78 444 55 66", zone: "Thiès / Mbour" },
  ];
  for (const c of commerciauxData) {
    await db.run(sql`INSERT OR IGNORE INTO commerciaux (id, name, phone, zone) VALUES (${c.id}, ${c.name}, ${c.phone}, ${c.zone})`);
  }

  // 45 days of data
  const today = new Date();
  const days: string[] = [];
  for (let i = 44; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const comNames = commerciauxData.map((c) => c.name);
  const prix = 650;

  for (const date of days) {
    // Production: 1-2 lots per day
    const lots = Math.floor(Math.random() * 2) + 1;
    for (let l = 0; l < lots; l++) {
      const qty = Math.floor(Math.random() * 200) + 150;
      await db.run(sql`INSERT OR IGNORE INTO production_entries (id, date, quantity) VALUES (${`prod_${date}_${l}`}, ${date}, ${qty})`);
    }

    // Sales: 3-8 per day
    const numSales = Math.floor(Math.random() * 6) + 3;
    for (let s = 0; s < numSales; s++) {
      const client = clientsData[Math.floor(Math.random() * clientsData.length)];
      const qty = (Math.floor(Math.random() * 10) + 2) * 5;
      const mode = Math.random() > 0.65 ? "credit" : "cash";
      const commercial = comNames[Math.floor(Math.random() * comNames.length)];
      const amount = qty * prix;
      const saleId = `sale_${date}_${s}`;
      await db.run(sql`INSERT OR IGNORE INTO sale_entries (id, date, clientId, clientName, quantity, mode, commercial, amount) VALUES (${saleId}, ${date}, ${client.id}, ${client.name}, ${qty}, ${mode}, ${commercial}, ${amount})`);

      if (mode === "credit") {
        const daysAgo = days.indexOf(date);
        const status = daysAgo > 30 ? (Math.random() > 0.4 ? "paye" : "en_retard") :
          daysAgo > 10 ? (Math.random() > 0.7 ? "paye" : "en_cours") : "en_cours";
        await db.run(sql`INSERT OR IGNORE INTO recovery_entries (id, saleId, clientName, amount, date, status) VALUES (${`rec_${saleId}`}, ${saleId}, ${client.name}, ${amount}, ${date}, ${status})`);
      }
    }

    // Expenses: 1-3 per day
    const expOptions = [
      { cat: "Variable", desig: "Rouleaux de sachet", min: 15000, max: 45000 },
      { cat: "Variable", desig: "Produit antiscalant", min: 3000, max: 8000 },
      { cat: "Variable", desig: "Eau de source brute", min: 2000, max: 5000 },
      { cat: "Fixe", desig: "Électricité", min: 8000, max: 12000 },
      { cat: "Fixe", desig: "Loyer atelier", min: 25000, max: 25000 },
      { cat: "Fixe", desig: "Salaires", min: 60000, max: 80000 },
      { cat: "Distribution", desig: "Carburant livraison", min: 5000, max: 15000 },
      { cat: "Distribution", desig: "Entretien véhicule", min: 3000, max: 12000 },
      { cat: "Ponctuel", desig: "Réparation machine", min: 10000, max: 50000 },
      { cat: "Amortissement", desig: "Machine de production", min: 15000, max: 20000 },
    ];
    const numExp = Math.floor(Math.random() * 3) + 1;
    const usedIdx = new Set<number>();
    for (let e = 0; e < numExp; e++) {
      let idx: number;
      do { idx = Math.floor(Math.random() * expOptions.length); } while (usedIdx.has(idx));
      usedIdx.add(idx);
      const ec = expOptions[idx];
      const amount = Math.round((Math.random() * (ec.max - ec.min) + ec.min) / 500) * 500;
      await db.run(sql`INSERT OR IGNORE INTO expense_entries (id, date, category, designation, amount, type, supplier) VALUES (${`exp_${date}_${e}`}, ${date}, ${ec.cat}, ${ec.desig}, ${amount}, ${ec.cat}, ${""})`);
    }

    // Tournées: 2 per day
    const livreurs = ["Pape Diallo", "Serigne Mbaye", "Baye Fall", "Omar Sy"];
    for (let t = 0; t < 2; t++) {
      const livreur = livreurs[t];
      const sortis = (Math.floor(Math.random() * 15) + 10) * 5;
      const rendus = Math.floor(Math.random() * 5) * 5;
      const vendus = sortis - rendus;
      const cashAttendu = vendus * prix;
      const ecart = Math.floor(Math.random() * 3) * 500;
      const cashRemis = cashAttendu - ecart;
      await db.run(sql`INSERT OR IGNORE INTO tournee_entries (id, date, livreur, sortis, rendus, vendus, cashAttendu, cashRemis, ecart) VALUES (${`tournee_${date}_${t}`}, ${date}, ${livreur}, ${sortis}, ${rendus}, ${vendus}, ${cashAttendu}, ${cashRemis}, ${ecart})`);
    }
  }

  // Caisse: last 30 days
  let solde = 350000;
  for (const date of days.slice(-30)) {
    const recettes = Math.round((Math.random() * 300000 + 100000) / 1000) * 1000;
    const recouvrement = Math.round((Math.random() * 80000) / 1000) * 1000;
    const depenses = Math.round((Math.random() * 150000 + 50000) / 1000) * 1000;
    const soldeFin = solde + recettes + recouvrement - depenses;
    await db.run(sql`INSERT OR IGNORE INTO caisse_entries (id, date, soldeInitial, recettes, recouvrement, depenses, soldeFin) VALUES (${`caisse_${date}`}, ${date}, ${solde}, ${recettes}, ${recouvrement}, ${depenses}, ${soldeFin})`);
    solde = soldeFin;
  }

  console.log("[DB] Seed complete — 45 days of fictional data loaded.");
}
