# Odoo Integration

This repo now treats Odoo as the business engine and keeps the Expo app as the mobile UI.

## Shape

```text
Expo UI
  -> tRPC client
  -> Node/Express API
  -> Odoo JSON-RPC
  -> Odoo PostgreSQL database
```

Do not import Odoo Python code into the Expo app. Run Odoo as a separate service and call it from the Node API.

## Required Odoo Setup

Install these Odoo apps in the target database:

- Inventory
- Sales
- Invoicing/Accounting
- Manufacturing, when you are ready to model bill of materials instead of simple stock adjustments

Create one storable product for the finished pack:

- Name: `AquaSachet Pack`
- Internal Reference: `AQUASACHET_PACK`
- Product type: consumable with inventory tracking enabled / storable behavior
- Sales price: the current pack price, for example `650`

Then either set `ODOO_PACK_PRODUCT_ID` to that product variant id, or leave it empty and let the adapter find `ODOO_PACK_PRODUCT_CODE`.

## Environment

Copy `.env.example` to `.env` or set equivalent shell environment variables, then set:

```bash
ODOO_URL=http://localhost:8069
ODOO_DB=aquasachets
ODOO_USERNAME=admin@example.com
ODOO_PASSWORD=change-me
ODOO_PACK_PRODUCT_ID=1
EXPO_PUBLIC_DATA_BACKEND=odoo
```

For a local proof of concept only, you can set:

```bash
ODOO_PUBLIC_API=true
```

Leave `ODOO_PUBLIC_API` false in production so Odoo business routes require the app user to be authenticated.

## API Added

The server now exposes:

- `trpc.odoo.health`
- `trpc.odoo.clients.list`
- `trpc.odoo.clients.create`
- `trpc.odoo.clients.archive`
- `trpc.odoo.stock.products`
- `trpc.odoo.stock.summary`
- `trpc.odoo.stock.recordFinishedPacks`
- `trpc.odoo.sales.list`
- `trpc.odoo.sales.create`

The first mobile-facing hooks are in `hooks/use-odoo.ts`. The Clients, Sales, and Stock screens now switch to those hooks when `EXPO_PUBLIC_DATA_BACKEND=odoo`; otherwise they keep using the existing local `AsyncStorage` stores.

## Current Business Mapping

- Clients map to `res.partner`.
- Stock reads from `product.product` quantities.
- Production currently records finished packs by increasing the finished pack product's on-hand quantity. This is a bridge step; later it should become `mrp.production` with a bill of materials.
- Sales create `sale.order` records with one line for the finished pack product. Passing `confirm: true` confirms the order.
- Cash/credit is currently stored in `client_order_ref` as mobile metadata. The next integration slice should create invoices/payments so recouvrement and caisse come directly from Odoo accounting.

## Suggested Next Slice

1. Start Odoo and confirm `trpc.odoo.health` authenticates.
2. Seed the finished pack product and set `ODOO_PACK_PRODUCT_ID`.
3. Switch `EXPO_PUBLIC_DATA_BACKEND=odoo`.
4. Confirm the Clients, Sales, and Stock screens load Odoo data.
5. Move Production from simple stock adjustment to `mrp.production` once the bill of materials is configured.
6. Replace local recouvrement with customer invoices and residual payment status.
7. Replace local caisse with Odoo payments/cash journal entries.
