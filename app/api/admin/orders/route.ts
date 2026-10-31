import { requireAdmin } from "@/lib/auth/session";
import { listAllOrders, updateOrderStatus } from "@/lib/commerce/orders";
import { assertCsrf } from "@/lib/csrf";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { assertBodySize, sanitizeText } from "@/lib/validation";
import { z } from "zod";

export async function GET() {
  try {
    await requireAdmin();
    const orders = listAllOrders(200).map((o) => ({
      reference: o.reference,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      totalPkr: o.totalPkr,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      createdAt: o.createdAt,
      itemCount: o.items.length,
    }));
    return jsonOk({ orders });
  } catch (err) {
    return handleRouteError(err);
  }
}

const patchSchema = z.object({
  reference: z.string().min(6).max(40).transform((v) => sanitizeText(v, 40)),
  status: z.enum([
    "pending_confirmation",
    "confirmed",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  paymentStatus: z
    .enum(["unpaid", "awaiting_transfer", "pending_provider", "paid", "refunded"])
    .optional(),
});

export async function PATCH(request: Request) {
  try {
    await assertCsrf(request);
    await requireAdmin();
    const raw = await request.text();
    assertBodySize(raw);
    const parsed = patchSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return jsonError("Invalid update.");

    updateOrderStatus(
      parsed.data.reference.toUpperCase(),
      parsed.data.status,
      parsed.data.paymentStatus,
    );
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
