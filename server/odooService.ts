import { ENV } from "./_core/env";
import { odooClient, type OdooDomain, type OdooId, type OdooMany2One } from "./odooClient";

export type OdooClientSummary = {
  id: number;
  name: string;
  phone: string;
  zone: string;
  email: string;
  active: boolean;
};

export type OdooProductStock = {
  id: number;
  name: string;
  code: string;
  barcode: string;
  listPrice: number;
  cost: number;
  quantityOnHand: number;
  forecastQuantity: number;
  uom: string;
};

export type OdooStockSummary = {
  products: OdooProductStock[];
  totalQuantityOnHand: number;
  totalSalesValue: number;
  packProductId: number | null;
};

export type OdooSaleSummary = {
  id: number;
  name: string;
  date: string;
  clientId: number | null;
  clientName: string;
  salesRepId: number | null;
  salesRepName: string;
  quantity: number;
  state: string;
  invoiceStatus: string;
  amountTotal: number;
  paymentMode: "cash" | "credit" | "unknown";
};

type PartnerRecord = {
  id: number;
  name: string | false;
  phone: string | false;
  mobile: string | false;
  city: string | false;
  email: string | false;
  active: boolean;
};

type ProductRecord = {
  id: number;
  display_name: string | false;
  default_code: string | false;
  barcode: string | false;
  list_price: number | false;
  standard_price: number | false;
  qty_available: number | false;
  virtual_available: number | false;
  uom_id: OdooMany2One;
};

type SaleRecord = {
  id: number;
  name: string | false;
  date_order: string | false;
  partner_id: OdooMany2One;
  user_id: OdooMany2One;
  state: string | false;
  invoice_status: string | false;
  amount_total: number | false;
  client_order_ref: string | false;
  order_line: OdooId[] | false;
};

type SaleLineRecord = {
  id: number;
  order_id: OdooMany2One;
  product_uom_qty: number | false;
};

function m2oId(value: OdooMany2One): number | null {
  return Array.isArray(value) ? value[0] : null;
}

function m2oName(value: OdooMany2One): string {
  return Array.isArray(value) ? value[1] : "";
}

function text(value: string | false | null | undefined): string {
  return value || "";
}

function numberValue(value: number | false | null | undefined): number {
  return typeof value === "number" ? value : 0;
}

function paymentModeFromRef(value: string | false): OdooSaleSummary["paymentMode"] {
  const normalized = text(value).toLowerCase();
  if (normalized.includes("cash")) return "cash";
  if (normalized.includes("credit")) return "credit";
  return "unknown";
}

export async function checkOdooConnection() {
  if (!odooClient.isConfigured()) {
    return {
      configured: false,
      authenticated: false,
      uid: null,
      url: ENV.odooUrl || null,
      db: ENV.odooDb || null,
    };
  }

  const uid = await odooClient.authenticate(true);
  return {
    configured: true,
    authenticated: true,
    uid,
    url: ENV.odooUrl,
    db: ENV.odooDb,
  };
}

export async function listClients(input: { search?: string; limit?: number } = {}): Promise<OdooClientSummary[]> {
  const domain: OdooDomain = [["active", "=", true]];
  if (input.search) {
    domain.push(["name", "ilike", input.search]);
  }

  const records = await odooClient.searchRead<PartnerRecord>(
    "res.partner",
    domain,
    ["name", "phone", "mobile", "city", "email", "active"],
    { limit: input.limit ?? 100, order: "name asc" },
  );

  return records.map((partner) => ({
    id: partner.id,
    name: text(partner.name),
    phone: text(partner.phone) || text(partner.mobile),
    zone: text(partner.city),
    email: text(partner.email),
    active: partner.active,
  }));
}

export async function createClient(input: {
  name: string;
  phone?: string;
  zone?: string;
  email?: string;
}): Promise<OdooClientSummary> {
  const id = await odooClient.create("res.partner", {
    name: input.name,
    phone: input.phone || false,
    city: input.zone || false,
    email: input.email || false,
  });

  const [client] = await listClients({ search: input.name, limit: 1 });
  return client ?? {
    id,
    name: input.name,
    phone: input.phone ?? "",
    zone: input.zone ?? "",
    email: input.email ?? "",
    active: true,
  };
}

export async function archiveClient(id: OdooId): Promise<{ success: true }> {
  await odooClient.write("res.partner", [id], { active: false });
  return { success: true };
}

export async function listProductStock(input: { search?: string; limit?: number } = {}): Promise<OdooProductStock[]> {
  const domain: OdooDomain = [["is_storable", "=", true], ["active", "=", true]];
  if (input.search) {
    domain.push(["display_name", "ilike", input.search]);
  }

  const records = await odooClient.searchRead<ProductRecord>(
    "product.product",
    domain,
    [
      "display_name",
      "default_code",
      "barcode",
      "list_price",
      "standard_price",
      "qty_available",
      "virtual_available",
      "uom_id",
    ],
    { limit: input.limit ?? 100, order: "display_name asc" },
  );

  return records.map((product) => ({
    id: product.id,
    name: text(product.display_name),
    code: text(product.default_code),
    barcode: text(product.barcode),
    listPrice: numberValue(product.list_price),
    cost: numberValue(product.standard_price),
    quantityOnHand: numberValue(product.qty_available),
    forecastQuantity: numberValue(product.virtual_available),
    uom: m2oName(product.uom_id),
  }));
}

export async function getStockSummary(): Promise<OdooStockSummary> {
  const products = await listProductStock();
  const packProductId = await resolvePackProductId(false);

  return {
    products,
    totalQuantityOnHand: products.reduce((sum, product) => sum + product.quantityOnHand, 0),
    totalSalesValue: products.reduce(
      (sum, product) => sum + product.quantityOnHand * product.listPrice,
      0,
    ),
    packProductId,
  };
}

export async function resolvePackProductId(throwIfMissing = true): Promise<number | null> {
  const configuredId = Number.parseInt(ENV.odooPackProductId, 10);
  if (Number.isFinite(configuredId) && configuredId > 0) {
    return configuredId;
  }

  const byCode = await odooClient.search(
    "product.product",
    [["default_code", "=", ENV.odooPackProductCode]],
    { limit: 1 },
  );
  if (byCode[0]) return byCode[0];

  const byName = await odooClient.search(
    "product.product",
    [["display_name", "ilike", "sachet"]],
    { limit: 1 },
  );
  if (byName[0]) return byName[0];

  if (throwIfMissing) {
    throw new Error(
      `No AquaSachet pack product found in Odoo. Set ODOO_PACK_PRODUCT_ID or create a storable product with default code ${ENV.odooPackProductCode}.`,
    );
  }
  return null;
}

export async function recordFinishedPacks(input: {
  quantity: number;
  productId?: number;
}): Promise<{ productId: number; previousQuantity: number; newQuantity: number }> {
  const productId = input.productId ?? (await resolvePackProductId());
  if (!productId) {
    throw new Error("Missing Odoo product id for production.");
  }

  const [product] = await odooClient.read<ProductRecord>(
    "product.product",
    [productId],
    ["qty_available"],
  );
  const previousQuantity = numberValue(product?.qty_available);
  const newQuantity = previousQuantity + input.quantity;

  await odooClient.write("product.product", [productId], {
    qty_available: newQuantity,
  });

  return { productId, previousQuantity, newQuantity };
}

// ─── Raw material types ───────────────────────────────────────────────────────

type ManufacturingRecord = {
  id: number;
  name: string | false;
  product_id: OdooMany2One;
  product_qty: number | false;
  qty_producing: number | false;
  state: string | false;
  date_start: string | false;
};

type PurchaseRecord = {
  id: number;
  name: string | false;
  partner_id: OdooMany2One;
  state: string | false;
  date_order: string | false;
  amount_total: number | false;
  order_line: OdooId[] | false;
};

type PurchaseLineRecord = {
  id: number;
  product_id: OdooMany2One;
  product_qty: number | false;
  price_unit: number | false;
  price_subtotal: number | false;
  order_id: OdooMany2One;
};

type PickingRecord = {
  id: number;
  name: string | false;
  partner_id: OdooMany2One;
  state: string | false;
  scheduled_date: string | false;
  date_done: string | false;
  origin: string | false;
  picking_type_code: string | false;
  move_ids: OdooId[] | false;
};

type UserRecord = {
  id: number;
  name: string | false;
  email: string | false;
  login: string | false;
  share: boolean;
};

export type OdooManufacturingOrder = {
  id: number;
  name: string;
  productName: string;
  productQty: number;
  qtyProduced: number;
  state: string;
  dateStart: string;
};

export type OdooPurchaseLine = {
  productId: number;
  productName: string;
  qty: number;
  priceUnit: number;
  amount: number;
};

export type OdooPurchaseOrder = {
  id: number;
  name: string;
  vendorName: string;
  state: string;
  dateOrder: string;
  amountTotal: number;
  lines: OdooPurchaseLine[];
};

export type OdooPicking = {
  id: number;
  name: string;
  partnerName: string;
  state: string;
  scheduledDate: string;
  dateDone: string;
  origin: string;
  type: "incoming" | "outgoing" | "internal";
};

export type OdooSalesRep = {
  id: number;
  name: string;
  email: string;
  login: string;
};

// ─── Location helpers ─────────────────────────────────────────────────────────

async function resolvePickingTypeId(code: "incoming" | "outgoing"): Promise<number> {
  const ids = await odooClient.search(
    "stock.picking.type",
    [["code", "=", code], ["active", "=", true]],
    { limit: 1 },
  );
  if (!ids[0]) throw new Error(`No ${code} picking type found in Odoo`);
  return ids[0];
}

async function resolveUsageLocationId(usage: "supplier" | "customer"): Promise<number> {
  const ids = await odooClient.search(
    "stock.location",
    [["usage", "=", usage]],
    { limit: 1 },
  );
  if (!ids[0]) throw new Error(`No ${usage} location found in Odoo`);
  return ids[0];
}

async function resolveInternalLocationId(): Promise<number> {
  const byName = await odooClient.search(
    "stock.location",
    [["usage", "=", "internal"], ["complete_name", "ilike", "WH/Stock"]],
    { limit: 1 },
  );
  if (byName[0]) return byName[0];
  const fallback = await odooClient.search(
    "stock.location",
    [["usage", "=", "internal"]],
    { limit: 1 },
  );
  if (!fallback[0]) throw new Error("No internal stock location found in Odoo");
  return fallback[0];
}

// ─── Raw materials stock ──────────────────────────────────────────────────────

export async function listRawMaterials(): Promise<OdooProductStock[]> {
  const packId = await resolvePackProductId(false);
  const domain: OdooDomain = [["is_storable", "=", true], ["active", "=", true]];
  if (packId) domain.push(["id", "!=", packId]);

  const records = await odooClient.searchRead<ProductRecord>(
    "product.product",
    domain,
    ["display_name", "default_code", "qty_available", "virtual_available", "uom_id", "standard_price"],
    { limit: 100, order: "display_name asc" },
  );

  return records.map((p) => ({
    id: p.id,
    name: text(p.display_name),
    code: text(p.default_code),
    barcode: "",
    listPrice: 0,
    cost: numberValue(p.standard_price),
    quantityOnHand: numberValue(p.qty_available),
    forecastQuantity: numberValue(p.virtual_available),
    uom: m2oName(p.uom_id),
  }));
}

// ─── Stock pickings (receipts / deliveries) ───────────────────────────────────

function mapPicking(r: PickingRecord): OdooPicking {
  const code = text(r.picking_type_code);
  return {
    id: r.id,
    name: text(r.name),
    partnerName: m2oName(r.partner_id),
    state: text(r.state),
    scheduledDate: text(r.scheduled_date).slice(0, 10),
    dateDone: text(r.date_done).slice(0, 10),
    origin: text(r.origin),
    type: code === "outgoing" ? "outgoing" : code === "incoming" ? "incoming" : "internal",
  };
}

const PICKING_FIELDS = ["name", "partner_id", "state", "scheduled_date", "date_done", "origin", "picking_type_code", "move_ids"];

export async function listPickings(type: "incoming" | "outgoing", limit = 100): Promise<OdooPicking[]> {
  const records = await odooClient.searchRead<PickingRecord>(
    "stock.picking",
    [["picking_type_code", "=", type], ["state", "not in", ["cancel"]]],
    PICKING_FIELDS,
    { limit, order: "scheduled_date desc" },
  );
  return records.map(mapPicking);
}

export async function createReceipt(input: {
  productId: number;
  quantity: number;
  reference?: string;
  vendorId?: number;
}): Promise<OdooPicking> {
  const [pickingTypeId, supplierLocId, stockLocId] = await Promise.all([
    resolvePickingTypeId("incoming"),
    resolveUsageLocationId("supplier"),
    resolveInternalLocationId(),
  ]);

  const id = await odooClient.create("stock.picking", {
    picking_type_id: pickingTypeId,
    location_id: supplierLocId,
    location_dest_id: stockLocId,
    partner_id: input.vendorId || false,
    origin: input.reference || "AquaSachet",
    move_ids: [[0, 0, {
      name: "Receipt",
      product_id: input.productId,
      product_uom_qty: input.quantity,
      location_id: supplierLocId,
      location_dest_id: stockLocId,
    }]],
  });

  await odooClient.action("stock.picking", "action_confirm", [id]);

  // Try to auto-validate (set qty done + button_validate)
  try {
    await odooClient.action("stock.picking", "action_assign", [id]);
    const [picking] = await odooClient.read<PickingRecord>("stock.picking", [id], ["move_ids"]);
    if (Array.isArray(picking?.move_ids) && picking.move_ids.length > 0) {
      await odooClient.write("stock.move", picking.move_ids, { quantity: input.quantity });
      await odooClient.action("stock.picking", "button_validate", [id]);
    }
  } catch {
    // Picking stays confirmed — user can validate in Odoo if needed
  }

  const [record] = await odooClient.read<PickingRecord>("stock.picking", [id], PICKING_FIELDS);
  return mapPicking(record);
}

export async function createDelivery(input: {
  partnerName: string;
  partnerId?: number;
  productId?: number;
  quantity: number;
  reference?: string;
}): Promise<OdooPicking> {
  const [pickingTypeId, stockLocId, customerLocId] = await Promise.all([
    resolvePickingTypeId("outgoing"),
    resolveInternalLocationId(),
    resolveUsageLocationId("customer"),
  ]);

  const productId = input.productId ?? (await resolvePackProductId());
  if (!productId) throw new Error("Missing product ID for delivery");

  let partnerId = input.partnerId;
  if (!partnerId) {
    const existing = await odooClient.search("res.partner", [["name", "=", input.partnerName]], { limit: 1 });
    partnerId = existing[0] || await odooClient.create("res.partner", { name: input.partnerName });
  }

  const id = await odooClient.create("stock.picking", {
    picking_type_id: pickingTypeId,
    location_id: stockLocId,
    location_dest_id: customerLocId,
    partner_id: partnerId,
    origin: input.reference || "AquaSachet",
    move_ids: [[0, 0, {
      name: "Delivery",
      product_id: productId,
      product_uom_qty: input.quantity,
      location_id: stockLocId,
      location_dest_id: customerLocId,
    }]],
  });

  const [record] = await odooClient.read<PickingRecord>("stock.picking", [id], PICKING_FIELDS);
  return mapPicking(record);
}

// ─── Manufacturing orders (mrp.production) ────────────────────────────────────

export async function listManufacturingOrders(input: { limit?: number } = {}): Promise<OdooManufacturingOrder[]> {
  const records = await odooClient.searchRead<ManufacturingRecord>(
    "mrp.production",
    [["state", "not in", ["cancel"]]],
    ["name", "product_id", "product_qty", "qty_producing", "state", "date_start"],
    { limit: input.limit ?? 100, order: "date_start desc" },
  );
  return records.map((r) => ({
    id: r.id,
    name: text(r.name),
    productName: m2oName(r.product_id),
    productQty: numberValue(r.product_qty),
    qtyProduced: numberValue(r.qty_producing),
    state: text(r.state),
    dateStart: text(r.date_start).slice(0, 10),
  }));
}

export async function createManufacturingOrder(input: {
  quantity: number;
  productId?: number;
  reference?: string;
}): Promise<OdooManufacturingOrder> {
  const productId = input.productId ?? (await resolvePackProductId());
  if (!productId) throw new Error("Missing product ID for manufacturing order");

  const bomIds = await odooClient.search("mrp.bom", [["product_id", "=", productId]], { limit: 1 });
  const orderData: Record<string, unknown> = {
    product_id: productId,
    product_qty: input.quantity,
    origin: input.reference || "AquaSachet",
  };
  if (bomIds[0]) orderData.bom_id = bomIds[0];

  const id = await odooClient.create("mrp.production", orderData);
  await odooClient.action("mrp.production", "action_confirm", [id]);

  const [order] = await odooClient.read<ManufacturingRecord>(
    "mrp.production", [id],
    ["name", "product_id", "product_qty", "qty_producing", "state", "date_start"],
  );

  return {
    id,
    name: text(order?.name),
    productName: m2oName(order?.product_id ?? false),
    productQty: input.quantity,
    qtyProduced: 0,
    state: text(order?.state),
    dateStart: text(order?.date_start).slice(0, 10),
  };
}

export async function produceManufacturingOrder(id: number, quantity: number): Promise<{ success: true }> {
  await odooClient.write("mrp.production", [id], { qty_producing: quantity });
  await odooClient.action("mrp.production", "button_mark_done", [id]);
  return { success: true };
}

// ─── Purchase orders (purchase.order) ────────────────────────────────────────

export async function listPurchases(input: { limit?: number } = {}): Promise<OdooPurchaseOrder[]> {
  const records = await odooClient.searchRead<PurchaseRecord>(
    "purchase.order",
    [["state", "not in", ["cancel"]]],
    ["name", "partner_id", "state", "date_order", "amount_total", "order_line"],
    { limit: input.limit ?? 100, order: "date_order desc" },
  );

  const allLineIds = records.flatMap((r) => (Array.isArray(r.order_line) ? r.order_line : []));
  const lines = allLineIds.length > 0
    ? await odooClient.read<PurchaseLineRecord>("purchase.order.line", allLineIds, [
        "product_id", "product_qty", "price_unit", "price_subtotal", "order_id",
      ])
    : [];

  const linesByOrderId = new Map<number, OdooPurchaseLine[]>();
  lines.forEach((l) => {
    const orderId = m2oId(l.order_id);
    if (!orderId) return;
    const list = linesByOrderId.get(orderId) ?? [];
    list.push({
      productId: m2oId(l.product_id) ?? 0,
      productName: m2oName(l.product_id),
      qty: numberValue(l.product_qty),
      priceUnit: numberValue(l.price_unit),
      amount: numberValue(l.price_subtotal),
    });
    linesByOrderId.set(orderId, list);
  });

  return records.map((r) => ({
    id: r.id,
    name: text(r.name),
    vendorName: m2oName(r.partner_id),
    state: text(r.state),
    dateOrder: text(r.date_order).slice(0, 10),
    amountTotal: numberValue(r.amount_total),
    lines: linesByOrderId.get(r.id) ?? [],
  }));
}

export async function createPurchase(input: {
  vendorName: string;
  vendorId?: number;
  lines: { productId: number; qty: number; priceUnit: number }[];
}): Promise<{ id: number; name: string }> {
  let vendorId = input.vendorId;
  if (!vendorId) {
    const existing = await odooClient.search(
      "res.partner",
      [["name", "ilike", input.vendorName]],
      { limit: 1 },
    );
    vendorId = existing[0] || (await odooClient.create("res.partner", {
      name: input.vendorName,
      supplier_rank: 1,
    }));
  }

  const id = await odooClient.create("purchase.order", {
    partner_id: vendorId,
    order_line: input.lines.map((l) => [0, 0, {
      product_id: l.productId,
      product_qty: l.qty,
      price_unit: l.priceUnit,
    }]),
  });

  const [order] = await odooClient.read<PurchaseRecord>("purchase.order", [id], ["name"]);
  return { id, name: text(order?.name) || `PO/${id}` };
}

export async function confirmPurchase(id: number): Promise<{ success: true }> {
  await odooClient.action("purchase.order", "button_confirm", [id]);
  return { success: true };
}

export async function receivePurchase(id: number): Promise<{ success: true }> {
  // Get the receipt picking linked to this PO
  const pickingIds = await odooClient.search(
    "stock.picking",
    [["purchase_id", "=", id], ["state", "not in", ["done", "cancel"]]],
    { limit: 1 },
  );
  if (!pickingIds[0]) throw new Error("No pending receipt found for this purchase order");

  const pickingId = pickingIds[0];
  await odooClient.action("stock.picking", "action_confirm", [pickingId]);
  await odooClient.action("stock.picking", "action_assign", [pickingId]);

  const [picking] = await odooClient.read<PickingRecord>("stock.picking", [pickingId], ["move_ids"]);
  if (Array.isArray(picking?.move_ids) && picking.move_ids.length > 0) {
    const moves = await odooClient.read<{ id: number; product_uom_qty: number | false }>(
      "stock.move", picking.move_ids, ["product_uom_qty"],
    );
    for (const move of moves) {
      await odooClient.write("stock.move", [move.id], { quantity: numberValue(move.product_uom_qty) });
    }
  }
  await odooClient.action("stock.picking", "button_validate", [pickingId]);
  return { success: true };
}

// ─── Sales reps (res.users) ───────────────────────────────────────────────────

export async function listSalesReps(): Promise<OdooSalesRep[]> {
  const records = await odooClient.searchRead<UserRecord>(
    "res.users",
    [["share", "=", false], ["active", "=", true]],
    ["name", "email", "login", "share"],
    { limit: 100, order: "name asc" },
  );
  return records
    .filter((u) => u.login !== "__system__")
    .map((u) => ({
      id: u.id,
      name: text(u.name),
      email: text(u.email),
      login: text(u.login),
    }));
}

// ─── (keep existing findOrCreatePartner below) ───────────────────────────────

async function findOrCreatePartner(input: { partnerId?: number; partnerName?: string }): Promise<number> {
  if (input.partnerId) return input.partnerId;
  const name = input.partnerName?.trim();
  if (!name) throw new Error("A partnerId or partnerName is required.");

  const existing = await odooClient.search("res.partner", [["name", "=", name]], { limit: 1 });
  if (existing[0]) return existing[0];

  return odooClient.create("res.partner", { name });
}

export async function listSales(input: { limit?: number } = {}): Promise<OdooSaleSummary[]> {
  const records = await odooClient.searchRead<SaleRecord>(
    "sale.order",
    [],
    [
      "name",
      "date_order",
      "partner_id",
      "user_id",
      "state",
      "invoice_status",
      "amount_total",
      "client_order_ref",
      "order_line",
    ],
    { limit: input.limit ?? 100, order: "date_order desc" },
  );
  const lineIds = records.flatMap((sale) => (Array.isArray(sale.order_line) ? sale.order_line : []));
  const lines =
    lineIds.length > 0
      ? await odooClient.read<SaleLineRecord>("sale.order.line", lineIds, [
          "order_id",
          "product_uom_qty",
        ])
      : [];
  const quantityBySaleId = new Map<number, number>();

  lines.forEach((line) => {
    const orderId = m2oId(line.order_id);
    if (!orderId) return;
    quantityBySaleId.set(
      orderId,
      (quantityBySaleId.get(orderId) ?? 0) + numberValue(line.product_uom_qty),
    );
  });

  return records.map((sale) => ({
    id: sale.id,
    name: text(sale.name),
    date: text(sale.date_order).slice(0, 10),
    clientId: m2oId(sale.partner_id),
    clientName: m2oName(sale.partner_id),
    salesRepId: m2oId(sale.user_id),
    salesRepName: m2oName(sale.user_id),
    quantity: quantityBySaleId.get(sale.id) ?? 0,
    state: text(sale.state),
    invoiceStatus: text(sale.invoice_status),
    amountTotal: numberValue(sale.amount_total),
    paymentMode: paymentModeFromRef(sale.client_order_ref),
  }));
}

export async function createSale(input: {
  partnerId?: number;
  partnerName?: string;
  productId?: number;
  quantity: number;
  priceUnit?: number;
  paymentMode: "cash" | "credit";
  confirm?: boolean;
}): Promise<OdooSaleSummary> {
  const partnerId = await findOrCreatePartner(input);
  const productId = input.productId ?? (await resolvePackProductId());
  if (!productId) {
    throw new Error("Missing Odoo product id for sale.");
  }

  const lineValues: Record<string, unknown> = {
    product_id: productId,
    product_uom_qty: input.quantity,
  };

  if (input.priceUnit !== undefined) {
    lineValues.price_unit = input.priceUnit;
  }

  const id = await odooClient.create("sale.order", {
    partner_id: partnerId,
    client_order_ref: `AquaSachet mobile ${input.paymentMode}`,
    order_line: [[0, 0, lineValues]],
  });

  if (input.confirm) {
    await odooClient.action("sale.order", "action_confirm", [id]);
  }

  const [sale] = await odooClient.read<SaleRecord>(
    "sale.order",
    [id],
    ["name", "date_order", "partner_id", "user_id", "state", "invoice_status", "amount_total", "client_order_ref"],
  );

  return {
    id,
    name: text(sale?.name),
    date: text(sale?.date_order).slice(0, 10),
    clientId: m2oId(sale?.partner_id ?? false),
    clientName: m2oName(sale?.partner_id ?? false),
    salesRepId: m2oId(sale?.user_id ?? false),
    salesRepName: m2oName(sale?.user_id ?? false),
    quantity: input.quantity,
    state: text(sale?.state),
    invoiceStatus: text(sale?.invoice_status),
    amountTotal: numberValue(sale?.amount_total),
    paymentMode: paymentModeFromRef(sale?.client_order_ref ?? false),
  };
}
