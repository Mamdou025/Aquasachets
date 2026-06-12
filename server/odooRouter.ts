import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";
import { publicProcedure, router } from "./_core/trpc";
import {
  archiveClient,
  checkOdooConnection,
  createClient,
  createSale,
  getStockSummary,
  listClients,
  listProductStock,
  listSales,
  recordFinishedPacks,
} from "./odooService";

function requireOdooAccess(ctx: TrpcContext) {
  if (ENV.odooPublicApi || ctx.user) return;

  throw new TRPCError({
    code: "UNAUTHORIZED",
    message:
      "Odoo API access requires login. Set ODOO_PUBLIC_API=true only for a local proof of concept.",
  });
}

const odooProcedure = publicProcedure.use(({ ctx, next }) => {
  requireOdooAccess(ctx);
  return next({ ctx });
});

const optionalSearchSchema = z.object({
  search: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export const odooRouter = router({
  health: publicProcedure.query(() => checkOdooConnection()),

  clients: router({
    list: odooProcedure.input(optionalSearchSchema.optional()).query(({ input }) => {
      return listClients(input ?? {});
    }),
    create: odooProcedure
      .input(
        z.object({
          name: z.string().trim().min(1),
          phone: z.string().trim().optional(),
          zone: z.string().trim().optional(),
          email: z.string().trim().email().optional(),
        }),
      )
      .mutation(({ input }) => createClient(input)),
    archive: odooProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => archiveClient(input.id)),
  }),

  stock: router({
    products: odooProcedure.input(optionalSearchSchema.optional()).query(({ input }) => {
      return listProductStock(input ?? {});
    }),
    summary: odooProcedure.query(() => getStockSummary()),
    recordFinishedPacks: odooProcedure
      .input(
        z.object({
          quantity: z.number().positive(),
          productId: z.number().int().positive().optional(),
        }),
      )
      .mutation(({ input }) => recordFinishedPacks(input)),
  }),

  sales: router({
    list: odooProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional())
      .query(({ input }) => listSales(input ?? {})),
    create: odooProcedure
      .input(
        z.object({
          partnerId: z.number().int().positive().optional(),
          partnerName: z.string().trim().min(1).optional(),
          productId: z.number().int().positive().optional(),
          quantity: z.number().positive(),
          priceUnit: z.number().nonnegative().optional(),
          paymentMode: z.enum(["cash", "credit"]),
          confirm: z.boolean().optional(),
        }),
      )
      .mutation(({ input }) => createSale(input)),
  }),
});
