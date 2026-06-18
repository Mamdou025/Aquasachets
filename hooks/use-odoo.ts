import { trpc } from "@/lib/trpc";
import { USE_ODOO_BACKEND } from "@/constants/data-source";

export function useOdooHealth() {
  return trpc.odoo.health.useQuery(undefined, {
    retry: false,
  });
}

export function useOdooClients(search?: string) {
  return trpc.odoo.clients.list.useQuery(
    { search: search?.trim() || undefined },
    {
      enabled: USE_ODOO_BACKEND,
      retry: false,
    },
  );
}

export function useCreateOdooClient() {
  const utils = trpc.useUtils();

  return trpc.odoo.clients.create.useMutation({
    onSuccess: async () => {
      await utils.odoo.clients.list.invalidate();
    },
  });
}

export function useArchiveOdooClient() {
  const utils = trpc.useUtils();

  return trpc.odoo.clients.archive.useMutation({
    onSuccess: async () => {
      await utils.odoo.clients.list.invalidate();
    },
  });
}

export function useOdooStock() {
  return trpc.odoo.stock.summary.useQuery(undefined, {
    enabled: USE_ODOO_BACKEND,
    retry: false,
  });
}

export function useRecordOdooProduction() {
  const utils = trpc.useUtils();

  return trpc.odoo.stock.recordFinishedPacks.useMutation({
    onSuccess: async () => {
      await utils.odoo.stock.summary.invalidate();
      await utils.odoo.stock.products.invalidate();
    },
  });
}

export function useOdooSales(limit = 100) {
  return trpc.odoo.sales.list.useQuery(
    { limit },
    {
      enabled: USE_ODOO_BACKEND,
      retry: false,
    },
  );
}

export function useCreateOdooSale() {
  const utils = trpc.useUtils();

  return trpc.odoo.sales.create.useMutation({
    onSuccess: async () => {
      await utils.odoo.sales.list.invalidate();
      await utils.odoo.stock.summary.invalidate();
      await utils.odoo.stock.products.invalidate();
    },
  });
}

// ─── Manufacturing ────────────────────────────────────────────────────────────

export function useOdooManufacturing(limit = 100) {
  return trpc.odoo.manufacturing.list.useQuery(
    { limit },
    { enabled: USE_ODOO_BACKEND, retry: false },
  );
}

export function useCreateManufacturingOrder() {
  const utils = trpc.useUtils();
  return trpc.odoo.manufacturing.create.useMutation({
    onSuccess: async () => {
      await utils.odoo.manufacturing.list.invalidate();
      await utils.odoo.stock.summary.invalidate();
    },
  });
}

export function useProduceManufacturingOrder() {
  const utils = trpc.useUtils();
  return trpc.odoo.manufacturing.produce.useMutation({
    onSuccess: async () => {
      await utils.odoo.manufacturing.list.invalidate();
      await utils.odoo.stock.summary.invalidate();
    },
  });
}

// ─── Purchases ────────────────────────────────────────────────────────────────

export function useOdooPurchases(limit = 100) {
  return trpc.odoo.purchases.list.useQuery(
    { limit },
    { enabled: USE_ODOO_BACKEND, retry: false },
  );
}

export function useCreateOdooPurchase() {
  const utils = trpc.useUtils();
  return trpc.odoo.purchases.create.useMutation({
    onSuccess: async () => {
      await utils.odoo.purchases.list.invalidate();
    },
  });
}

export function useConfirmOdooPurchase() {
  const utils = trpc.useUtils();
  return trpc.odoo.purchases.confirm.useMutation({
    onSuccess: async () => {
      await utils.odoo.purchases.list.invalidate();
    },
  });
}

export function useReceiveOdooPurchase() {
  const utils = trpc.useUtils();
  return trpc.odoo.purchases.receive.useMutation({
    onSuccess: async () => {
      await utils.odoo.purchases.list.invalidate();
      await utils.odoo.receipts.list.invalidate();
      await utils.odoo.stock.summary.invalidate();
      await utils.odoo.rawMaterials.list.invalidate();
    },
  });
}

// ─── Receipts & Deliveries ────────────────────────────────────────────────────

export function useOdooReceipts(limit = 100) {
  return trpc.odoo.receipts.list.useQuery(
    { limit },
    { enabled: USE_ODOO_BACKEND, retry: false },
  );
}

export function useCreateOdooReceipt() {
  const utils = trpc.useUtils();
  return trpc.odoo.receipts.create.useMutation({
    onSuccess: async () => {
      await utils.odoo.receipts.list.invalidate();
      await utils.odoo.rawMaterials.list.invalidate();
      await utils.odoo.stock.summary.invalidate();
    },
  });
}

export function useOdooDeliveries(limit = 100) {
  return trpc.odoo.deliveries.list.useQuery(
    { limit },
    { enabled: USE_ODOO_BACKEND, retry: false },
  );
}

export function useCreateOdooDelivery() {
  const utils = trpc.useUtils();
  return trpc.odoo.deliveries.create.useMutation({
    onSuccess: async () => {
      await utils.odoo.deliveries.list.invalidate();
      await utils.odoo.stock.summary.invalidate();
    },
  });
}

// ─── Raw Materials ────────────────────────────────────────────────────────────

export function useOdooRawMaterials() {
  return trpc.odoo.rawMaterials.list.useQuery(undefined, {
    enabled: USE_ODOO_BACKEND,
    retry: false,
  });
}

// ─── Sales Reps ───────────────────────────────────────────────────────────────

export function useOdooSalesReps() {
  return trpc.odoo.salesReps.list.useQuery(undefined, {
    enabled: USE_ODOO_BACKEND,
    retry: false,
  });
}
