import { trpc } from "@/lib/trpc";

// ─── Clients ─────────────────────────────────────────────────────────────────

export function useDbClients(search?: string) {
  return trpc.db.clients.list.useQuery(
    { search: search?.trim() || undefined },
    { retry: false },
  );
}

export function useCreateDbClient() {
  const utils = trpc.useUtils();
  return trpc.db.clients.create.useMutation({
    onSuccess: () => utils.db.clients.list.invalidate(),
  });
}

export function useDeleteDbClient() {
  const utils = trpc.useUtils();
  return trpc.db.clients.delete.useMutation({
    onSuccess: () => utils.db.clients.list.invalidate(),
  });
}

// ─── Commerciaux ─────────────────────────────────────────────────────────────

export function useDbCommerciaux() {
  return trpc.db.commerciaux.list.useQuery(undefined, { retry: false });
}

export function useCreateDbCommercial() {
  const utils = trpc.useUtils();
  return trpc.db.commerciaux.create.useMutation({
    onSuccess: () => utils.db.commerciaux.list.invalidate(),
  });
}

// ─── Production ──────────────────────────────────────────────────────────────

export function useDbProduction() {
  return trpc.db.production.list.useQuery(undefined, { retry: false });
}

export function useCreateDbProduction() {
  const utils = trpc.useUtils();
  return trpc.db.production.create.useMutation({
    onSuccess: () => utils.db.production.list.invalidate(),
  });
}

export function useDeleteDbProduction() {
  const utils = trpc.useUtils();
  return trpc.db.production.delete.useMutation({
    onSuccess: () => utils.db.production.list.invalidate(),
  });
}

// ─── Sales ───────────────────────────────────────────────────────────────────

export function useDbSales(search?: string) {
  return trpc.db.sales.list.useQuery(
    { search: search?.trim() || undefined },
    { retry: false },
  );
}

export function useCreateDbSale() {
  const utils = trpc.useUtils();
  return trpc.db.sales.create.useMutation({
    onSuccess: () => {
      utils.db.sales.list.invalidate();
      utils.db.recovery.list.invalidate();
    },
  });
}

export function useDeleteDbSale() {
  const utils = trpc.useUtils();
  return trpc.db.sales.delete.useMutation({
    onSuccess: () => utils.db.sales.list.invalidate(),
  });
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export function useDbExpenses() {
  return trpc.db.expenses.list.useQuery(undefined, { retry: false });
}

export function useCreateDbExpense() {
  const utils = trpc.useUtils();
  return trpc.db.expenses.create.useMutation({
    onSuccess: () => utils.db.expenses.list.invalidate(),
  });
}

export function useDeleteDbExpense() {
  const utils = trpc.useUtils();
  return trpc.db.expenses.delete.useMutation({
    onSuccess: () => utils.db.expenses.list.invalidate(),
  });
}

// ─── Tournées ────────────────────────────────────────────────────────────────

export function useDbTournees() {
  return trpc.db.tournees.list.useQuery(undefined, { retry: false });
}

export function useCreateDbTournee() {
  const utils = trpc.useUtils();
  return trpc.db.tournees.create.useMutation({
    onSuccess: () => utils.db.tournees.list.invalidate(),
  });
}

// ─── Recovery ────────────────────────────────────────────────────────────────

export function useDbRecovery() {
  return trpc.db.recovery.list.useQuery(undefined, { retry: false });
}

export function useCreateDbRecovery() {
  const utils = trpc.useUtils();
  return trpc.db.recovery.create.useMutation({
    onSuccess: () => utils.db.recovery.list.invalidate(),
  });
}

export function useUpdateDbRecoveryStatus() {
  const utils = trpc.useUtils();
  return trpc.db.recovery.updateStatus.useMutation({
    onSuccess: () => utils.db.recovery.list.invalidate(),
  });
}

// ─── Caisse ──────────────────────────────────────────────────────────────────

export function useDbCaisse() {
  return trpc.db.caisse.list.useQuery(undefined, { retry: false });
}

export function useUpsertDbCaisse() {
  const utils = trpc.useUtils();
  return trpc.db.caisse.upsert.useMutation({
    onSuccess: () => utils.db.caisse.list.invalidate(),
  });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function useDbSettings() {
  return trpc.db.settings.get.useQuery(undefined, { retry: false });
}

export function useSetDbSettings() {
  const utils = trpc.useUtils();
  return trpc.db.settings.set.useMutation({
    onSuccess: () => utils.db.settings.get.invalidate(),
  });
}

// ─── Seed ────────────────────────────────────────────────────────────────────

export function useDbSeedStatus() {
  return trpc.db.seed.status.useQuery(undefined, { retry: false });
}

export function useRunDbSeed() {
  const utils = trpc.useUtils();
  return trpc.db.seed.run.useMutation({
    onSuccess: () => utils.invalidate(),
  });
}

export function useResetDbSeed() {
  const utils = trpc.useUtils();
  return trpc.db.seed.reset.useMutation({
    onSuccess: () => utils.invalidate(),
  });
}
