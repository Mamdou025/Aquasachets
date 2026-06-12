import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => mockStorage[key] || null),
    setItem: vi.fn(async (key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete mockStorage[key];
    }),
  },
}));

import {
  ProductionStore,
  SaleStore,
  ExpenseStore,
  ClientStore,
  TourneeStore,
  RecoveryStore,
  SettingsStore,
  DEFAULT_SETTINGS,
  generateId,
  type ProductionEntry,
  type SaleEntry,
  type Client,
  type ExpenseEntry,
  type TourneeEntry,
  type RecoveryEntry,
} from "../lib/store";

describe("Store - generateId", () => {
  it("should generate unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(5);
  });
});

describe("Store - ProductionStore", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should return empty array when no data", async () => {
    const result = await ProductionStore.getAll();
    expect(result).toEqual([]);
  });

  it("should add and retrieve production entries", async () => {
    const entry: ProductionEntry = {
      id: "test1",
      date: "2026-06-09",
      quantity: 150,
    };
    await ProductionStore.add(entry);
    const result = await ProductionStore.getAll();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(entry);
  });

  it("should delete production entries", async () => {
    const entry: ProductionEntry = {
      id: "test2",
      date: "2026-06-09",
      quantity: 200,
    };
    await ProductionStore.add(entry);
    await ProductionStore.delete("test2");
    const result = await ProductionStore.getAll();
    expect(result).toHaveLength(0);
  });
});

describe("Store - SaleStore", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should add sales with correct structure", async () => {
    const sale: SaleEntry = {
      id: "sale1",
      date: "2026-06-09",
      clientId: "c1",
      clientName: "Client Test",
      quantity: 50,
      mode: "cash",
      commercial: "Commercial A",
      amount: 32500,
    };
    await SaleStore.add(sale);
    const result = await SaleStore.getAll();
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(32500);
    expect(result[0].mode).toBe("cash");
  });

  it("should handle credit sales", async () => {
    const sale: SaleEntry = {
      id: "sale2",
      date: "2026-06-09",
      clientId: "c2",
      clientName: "Client Crédit",
      quantity: 30,
      mode: "credit",
      commercial: "Commercial B",
      amount: 19500,
    };
    await SaleStore.add(sale);
    const result = await SaleStore.getAll();
    expect(result[0].mode).toBe("credit");
  });
});

describe("Store - ClientStore", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should add and retrieve clients", async () => {
    const client: Client = {
      id: "cl1",
      name: "Boutique Chez Fatou",
      zone: "Médina",
      phone: "771234567",
    };
    await ClientStore.add(client);
    const result = await ClientStore.getAll();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Boutique Chez Fatou");
  });
});

describe("Store - ExpenseStore", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should add expenses with categories", async () => {
    const expense: ExpenseEntry = {
      id: "exp1",
      date: "2026-06-09",
      category: "Variable",
      designation: "Rouleaux plastique",
      amount: 50000,
      type: "Variable",
      supplier: "Fournisseur A",
    };
    await ExpenseStore.add(expense);
    const result = await ExpenseStore.getAll();
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Variable");
    expect(result[0].amount).toBe(50000);
  });
});

describe("Store - TourneeStore", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should track delivery rounds with ecart calculation", async () => {
    const tournee: TourneeEntry = {
      id: "t1",
      date: "2026-06-09",
      livreur: "Moussa",
      sortis: 100,
      rendus: 10,
      vendus: 90,
      cashAttendu: 58500,
      cashRemis: 58500,
      ecart: 0,
    };
    await TourneeStore.add(tournee);
    const result = await TourneeStore.getAll();
    expect(result[0].ecart).toBe(0);
    expect(result[0].vendus).toBe(90);
  });
});

describe("Store - RecoveryStore", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should track credit recovery status", async () => {
    const recovery: RecoveryEntry = {
      id: "r1",
      saleId: "sale2",
      clientName: "Client Crédit",
      amount: 19500,
      date: "2026-06-09",
      status: "en_cours",
    };
    await RecoveryStore.add(recovery);

    // Mark as paid
    const updated: RecoveryEntry = {
      ...recovery,
      status: "paye",
      datePaiement: "2026-06-15",
    };
    await RecoveryStore.update(updated);
    const result = await RecoveryStore.getAll();
    expect(result[0].status).toBe("paye");
    expect(result[0].datePaiement).toBe("2026-06-15");
  });
});

describe("Store - SettingsStore", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should return default settings when none saved", async () => {
    const result = await SettingsStore.get();
    expect(result).toEqual(DEFAULT_SETTINGS);
    expect(result.prixVentePack).toBe(650);
  });

  it("should save and retrieve custom settings", async () => {
    const custom = { ...DEFAULT_SETTINGS, prixVentePack: 700 };
    await SettingsStore.set(custom);
    const result = await SettingsStore.get();
    expect(result.prixVentePack).toBe(700);
  });

  it("should have correct default cost values from Excel analysis", () => {
    expect(DEFAULT_SETTINGS.coutRouleaux).toBe(207.78);
    expect(DEFAULT_SETTINGS.coutAntiscalant).toBe(25);
    expect(DEFAULT_SETTINGS.coutEau).toBe(8);
    expect(DEFAULT_SETTINGS.coutMembrane).toBe(5);
    expect(DEFAULT_SETTINGS.coutElectricite).toBe(44);
    expect(DEFAULT_SETTINGS.coutLoyer).toBe(53);
    expect(DEFAULT_SETTINGS.coutSalaires).toBe(39);
    expect(DEFAULT_SETTINGS.coutMaintenance).toBe(12);
    expect(DEFAULT_SETTINGS.commissionCommercial).toBe(50);
    expect(DEFAULT_SETTINGS.coutCarburant).toBe(17);
  });

  it("should calculate total cost of production correctly", () => {
    const totalCost =
      DEFAULT_SETTINGS.coutRouleaux +
      DEFAULT_SETTINGS.coutAntiscalant +
      DEFAULT_SETTINGS.coutEau +
      DEFAULT_SETTINGS.coutMembrane +
      DEFAULT_SETTINGS.coutElectricite +
      DEFAULT_SETTINGS.coutLoyer +
      DEFAULT_SETTINGS.coutSalaires +
      DEFAULT_SETTINGS.coutMaintenance +
      DEFAULT_SETTINGS.commissionCommercial +
      DEFAULT_SETTINGS.coutCarburant;
    expect(totalCost).toBeCloseTo(460.78, 2);
    expect(DEFAULT_SETTINGS.prixVentePack - totalCost).toBeCloseTo(189.22, 2);
  });
});
