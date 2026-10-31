import { getSessionUser } from "@/lib/auth/session";
import { createOrder, OrderError } from "@/lib/commerce/orders";
import { getEnabledPaymentMethods } from "@/lib/commerce/settings";
import { assertCsrf } from "@/lib/csrf";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { consumeRateLimit } from "@/lib/rate-limit-db";
import { getClientIp } from "@/lib/client-ip";
import { assertBodySize, checkoutSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    const ip = getClientIp(request);
    const rl = consumeRateLimit(`checkout:${ip}`, 15, 60 * 60 * 1000);
    if (!rl.allowed) return jsonError("Too many checkout attempts. Try later.", 429);

    const raw = await request.text();
    assertBodySize(raw, 20_000);
    const parsed = checkoutSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid checkout data.");
    }

    const enabled = new Set(getEnabledPaymentMethods().map((m) => m.id));
    if (!enabled.has(parsed.data.paymentMethod)) {
      return jsonError("Selected payment method is not configured.", 400);
    }

    const user = await getSessionUser();
    const order = createOrder({
      userId: user?.id ?? null,
      lines: parsed.data.items,
      shipping: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        line1: parsed.data.line1,
        line2: parsed.data.line2,
        city: parsed.data.city,
        province: parsed.data.province,
        postalCode: parsed.data.postalCode,
      },
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes,
      idempotencyKey: parsed.data.idempotencyKey,
      enabledPaymentIds: enabled,
    });

    // Notifications: require SMTP / WhatsApp Business API — not auto-sent.
    if (process.env.SMTP_HOST) {
      console.info("[orders] confirmation email queued for", order.customerEmail);
    }

    return jsonOk({
      ok: true,
      order: {
        reference: order.reference,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotalPkr: order.subtotalPkr,
        shippingPkr: order.shippingPkr,
        totalPkr: order.totalPkr,
        trackingToken: order.trackingToken,
        items: order.items,
        createdAt: order.createdAt,
      },
      paymentNote:
        order.paymentMethod === "card_test"
          ? "Card test mode is configured but provider charge/webhook verification is still required before treating orders as paid."
          : order.paymentMethod === "order_request"
            ? "Order request recorded. This is not a completed paid order."
            : undefined,
    });
  } catch (err) {
    if (err instanceof OrderError) return jsonError(err.message, err.status);
    return handleRouteError(err);
  }
}
