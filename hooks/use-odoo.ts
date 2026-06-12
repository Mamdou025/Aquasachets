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
