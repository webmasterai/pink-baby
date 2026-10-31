import { createHash, randomBytes } from "node:crypto";
import { getDb, newId, nowIso, withTransaction } from "@/lib/db";
import {
  getConfiguredShippingPkr,
  type PaymentMethodId,
} from "@/lib/commerce/settings";
import {
  validateCartLines,
  type CartLineInput,
  type PricedLine,
} from "@/lib/commerce/pricing";

export type ShippingAddressInput = {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode?: string;
};

export type CreateOrderInput = {
  userId?: string | null;
  lines: CartLineInput[];
  shipping: ShippingAddressInput;
  paymentMethod: PaymentMethodId;
  notes?: string;
  idempotencyKey: string;
  enabledPaymentIds: Set<string>;
};

export type OrderRecord = {
  id: string;
  reference: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotalPkr: number;
  shippingPkr: number;
  totalPkr: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingJson: string;
  notes: string | null;
  createdAt: string;
  trackingToken: string;
  items: PricedLine[];
};

function makeReference(): string {
  const part = randomBytes(3).toString("hex").toUpperCase();
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `PB-${day}-${part}`;
}

function hashTracking(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createOrder(input: CreateOrderInput): OrderRecord {
  if (!input.enabledPaymentIds.has(input.paymentMethod)) {
    throw new OrderError("Selected payment method is not available.", 400);
  }

  const db = getDb();

  const existing = db
    .prepare(`SELECT id, reference FROM orders WHERE idempotency_key = ?`)
    .get(input.idempotencyKey) as { id: string; reference: string } | undefined;
  if (existing) {
    return getOrderByReference(existing.reference)!;
  }

  const priced = validateCartLines(input.lines);
  if (!priced.ok) {
    throw new OrderError(priced.errors.join(" ") || "Cart validation failed.", 400);
  }

  const shippingConfigured = getConfiguredShippingPkr();
  const shippingPkr = shippingConfigured ?? 0;
  const shippingNote =
    shippingConfigured == null
      ? "Shipping amount to be confirmed by Pink Baby before dispatch."
      : null;

  const totalPkr = priced.subtotalPkr + shippingPkr;
  const id = newId("ord");
  const reference = makeReference();
  const trackingToken = randomBytes(24).toString("base64url");
  const now = nowIso();
  const paymentStatus =
    input.paymentMethod === "order_request" || input.paymentMethod === "cod"
      ? "unpaid"
      : input.paymentMethod === "card_test"
        ? "pending_provider"
        : "awaiting_transfer";

  const notes = [input.notes?.trim() || null, shippingNote].filter(Boolean).join("\n") || null;

  const shippingPayload = {
    fullName: input.shipping.fullName,
    phone: input.shipping.phone,
    email: input.shipping.email,
    line1: input.shipping.line1,
    line2: input.shipping.line2 || "",
    city: input.shipping.city,
    province: input.shipping.province,
    postalCode: input.shipping.postalCode || "",
  };

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, reference, user_id, status, payment_method, payment_status, currency,
      subtotal_pkr, shipping_pkr, total_pkr, customer_name, customer_email, customer_phone,
      shipping_json, notes, idempotency_key, tracking_token_hash, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'PKR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO order_items (
      id, order_id, product_id, product_slug, product_name, sku, variant_label,
      unit_price_pkr, quantity, line_total_pkr
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  withTransaction(() => {
    insertOrder.run(
      id,
      reference,
      input.userId ?? null,
      "pending_confirmation",
      input.paymentMethod,
      paymentStatus,
      priced.subtotalPkr,
      shippingPkr,
      totalPkr,
      input.shipping.fullName,
      input.shipping.email.toLowerCase(),
      input.shipping.phone,
      JSON.stringify(shippingPayload),
      notes,
      input.idempotencyKey,
      hashTracking(trackingToken),
      now,
      now,
    );

    for (const line of priced.lines) {
      insertItem.run(
        newId("oi"),
        id,
        line.productId,
        line.productSlug,
        line.productName,
        line.sku,
        line.variantLabel,
        line.unitPricePkr,
        line.quantity,
        line.lineTotalPkr,
      );
    }
  });

  return {
    id,
    reference,
    status: "pending_confirmation",
    paymentMethod: input.paymentMethod,
    paymentStatus,
    subtotalPkr: priced.subtotalPkr,
    shippingPkr,
    totalPkr,
    customerName: input.shipping.fullName,
    customerEmail: input.shipping.email.toLowerCase(),
    customerPhone: input.shipping.phone,
    shippingJson: JSON.stringify(shippingPayload),
    notes,
    createdAt: now,
    trackingToken,
    items: priced.lines,
  };
}

export function getOrderByReference(reference: string): OrderRecord | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM orders WHERE reference = ?`)
    .get(reference) as Record<string, unknown> | undefined;
  if (!row) return null;
  const items = db
    .prepare(`SELECT * FROM order_items WHERE order_id = ?`)
    .all(row.id as string) as Array<Record<string, unknown>>;

  return {
    id: row.id as string,
    reference: row.reference as string,
    status: row.status as string,
    paymentMethod: row.payment_method as string,
    paymentStatus: row.payment_status as string,
    subtotalPkr: row.subtotal_pkr as number,
    shippingPkr: row.shipping_pkr as number,
    totalPkr: row.total_pkr as number,
    customerName: row.customer_name as string,
    customerEmail: row.customer_email as string,
    customerPhone: row.customer_phone as string,
    shippingJson: row.shipping_json as string,
    notes: (row.notes as string) || null,
    createdAt: row.created_at as string,
    trackingToken: "",
    items: items.map((i) => ({
      productId: i.product_id as string,
      productSlug: i.product_slug as string,
      productName: i.product_name as string,
      sku: (i.sku as string) || null,
      variantKey: "",
      variantLabel: (i.variant_label as string) || null,
      quantity: i.quantity as number,
      unitPricePkr: i.unit_price_pkr as number,
      lineTotalPkr: i.line_total_pkr as number,
      available: true,
      image: "",
    })),
  };
}

export function trackOrder(
  reference: string,
  emailOrPhone: string,
  trackingToken?: string,
): OrderRecord | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM orders WHERE reference = ?`)
    .get(reference) as Record<string, unknown> | undefined;
  if (!row) return null;

  const probe = emailOrPhone.trim().toLowerCase();
  const email = (row.customer_email as string).toLowerCase();
  const phone = String(row.customer_phone).replace(/\D/g, "");
  const probeDigits = probe.replace(/\D/g, "");
  const identityOk =
    probe === email ||
    (probeDigits.length >= 7 && phone.endsWith(probeDigits.slice(-10)));

  if (trackingToken) {
    const hash = hashTracking(trackingToken);
    if (hash !== row.tracking_token_hash) return null;
  } else if (!identityOk) {
    return null;
  }

  return getOrderByReference(reference);
}

export function listOrdersForUser(userId: string): OrderRecord[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT reference FROM orders WHERE user_id = ? ORDER BY created_at DESC`)
    .all(userId) as { reference: string }[];
  return rows
    .map((r) => getOrderByReference(r.reference))
    .filter((o): o is OrderRecord => !!o);
}

export function listAllOrders(limit = 100): OrderRecord[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT reference FROM orders ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as { reference: string }[];
  return rows
    .map((r) => getOrderByReference(r.reference))
    .filter((o): o is OrderRecord => !!o);
}

export function updateOrderStatus(
  reference: string,
  status: string,
  paymentStatus?: string,
): void {
  const db = getDb();
  if (paymentStatus) {
    db.prepare(
      `UPDATE orders SET status = ?, payment_status = ?, updated_at = ? WHERE reference = ?`,
    ).run(status, paymentStatus, nowIso(), reference);
  } else {
    db.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE reference = ?`).run(
      status,
      nowIso(),
      reference,
    );
  }
}

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
