import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_SETTINGS, Settings } from "@/shared/settings";
export { DEFAULT_SETTINGS, Settings };

// Types
export interface ProductionEntry {
  id: string;
  date: string; // YYYY-MM-DD
  quantity: number;
}

export interface Client {
  id: string;
  name: string;
  zone: string;
  phone: string;
}

export interface SaleEntry {
  id: string;
  date: string;
  clientId: string;
  clientName: string;
  quantity: number;
  mode: "cash" | "credit";
  commercial: string;
  amount: number;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  category: "Variable" | "Fixe" | "Distribution" | "Ponctuel" | "Amortissement";
  designation: string;
  amount: number;
  type: string;
  supplier: string;
}

export interface TourneeEntry {
  id: string;
  date: string;
  livreur: string;
  sortis: number;
  rendus: number;
  vendus: number;
  cashAttendu: number;
  cashRemis: number;
  ecart: number;
}

export interface RecoveryEntry {
  id: string;
  saleId: string;
  clientName: string;
  amount: number;
  date: string;
  status: "en_cours" | "paye" | "en_retard";
  datePaiement?: string;
}

export interface CaisseEntry {
  date: string;
  soldeInitial: number;
  recettes: number;
  recouvrement: number;
  depenses: number;
  soldeFin: number;
}

// Storage keys
const KEYS = {
  PRODUCTION: "aquasachet_production",
  CLIENTS: "aquasachet_clients",
  SALES: "aquasachet_sales",
  EXPENSES: "aquasachet_expenses",
  TOURNEES: "aquasachet_tournees",
  RECOVERY: "aquasachet_recovery",
  CAISSE: "aquasachet_caisse",
  SETTINGS: "aquasachet_settings",
  COMMERCIAUX: "aquasachet_commerciaux",
};

// Generic CRUD helpers
async function getItems<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function setItems<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

async function addItem<T>(key: string, item: T): Promise<void> {
  const items = await getItems<T>(key);
  items.push(item);
  await setItems(key, items);
}

async function updateItem<T extends { id: string }>(key: string, item: T): Promise<void> {
  const items = await getItems<T>(key);
  const index = items.findIndex((i) => i.id === item.id);
  if (index >= 0) {
    items[index] = item;
    await setItems(key, items);
  }
}

async function deleteItem<T extends { id: string }>(key: string, id: string): Promise<void> {
  const items = await getItems<T>(key);
  await setItems(key, items.filter((i) => i.id !== id));
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Production
export const ProductionStore = {
  getAll: () => getItems<ProductionEntry>(KEYS.PRODUCTION),
  add: (item: ProductionEntry) => addItem(KEYS.PRODUCTION, item),
  update: (item: ProductionEntry) => updateItem(KEYS.PRODUCTION, item),
  delete: (id: string) => deleteItem<ProductionEntry>(KEYS.PRODUCTION, id),
};

// Clients
export const ClientStore = {
  getAll: () => getItems<Client>(KEYS.CLIENTS),
  add: (item: Client) => addItem(KEYS.CLIENTS, item),
  update: (item: Client) => updateItem(KEYS.CLIENTS, item),
  delete: (id: string) => deleteItem<Client>(KEYS.CLIENTS, id),
};

// Sales
export const SaleStore = {
  getAll: () => getItems<SaleEntry>(KEYS.SALES),
  add: (item: SaleEntry) => addItem(KEYS.SALES, item),
  update: (item: SaleEntry) => updateItem(KEYS.SALES, item),
  delete: (id: string) => deleteItem<SaleEntry>(KEYS.SALES, id),
};

// Expenses
export const ExpenseStore = {
  getAll: () => getItems<ExpenseEntry>(KEYS.EXPENSES),
  add: (item: ExpenseEntry) => addItem(KEYS.EXPENSES, item),
  update: (item: ExpenseEntry) => updateItem(KEYS.EXPENSES, item),
  delete: (id: string) => deleteItem<ExpenseEntry>(KEYS.EXPENSES, id),
};

// Tournées
export const TourneeStore = {
  getAll: () => getItems<TourneeEntry>(KEYS.TOURNEES),
  add: (item: TourneeEntry) => addItem(KEYS.TOURNEES, item),
  update: (item: TourneeEntry) => updateItem(KEYS.TOURNEES, item),
  delete: (id: string) => deleteItem<TourneeEntry>(KEYS.TOURNEES, id),
};

// Recovery
export const RecoveryStore = {
  getAll: () => getItems<RecoveryEntry>(KEYS.RECOVERY),
  add: (item: RecoveryEntry) => addItem(KEYS.RECOVERY, item),
  update: (item: RecoveryEntry) => updateItem(KEYS.RECOVERY, item),
  delete: (id: string) => deleteItem<RecoveryEntry>(KEYS.RECOVERY, id),
};

// Caisse
export const CaisseStore = {
  getAll: () => getItems<CaisseEntry>(KEYS.CAISSE),
  set: (items: CaisseEntry[]) => setItems(KEYS.CAISSE, items),
  add: (item: CaisseEntry) => addItem(KEYS.CAISSE, item),
};

// Settings
export const SettingsStore = {
  get: async (): Promise<Settings> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  set: async (settings: Settings): Promise<void> => {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },
};

// Commerciaux
export interface Commercial {
  id: string;
  name: string;
  phone: string;
  zone: string;
}

export const CommercialStore = {
  getAll: () => getItems<Commercial>(KEYS.COMMERCIAUX),
  add: (item: Commercial) => addItem(KEYS.COMMERCIAUX, item),
  update: (item: Commercial) => updateItem(KEYS.COMMERCIAUX, item),
  delete: (id: string) => deleteItem<Commercial>(KEYS.COMMERCIAUX, id),
};
