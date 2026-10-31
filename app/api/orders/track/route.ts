import { trackOrder } from "@/lib/commerce/orders";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { consumeRateLimit } from "@/lib/rate-limit-db";
import { getClientIp } from "@/lib/client-ip";
import { assertBodySize, sanitizeText } from "@/lib/validation";
import { z } from "zod";

const schema = z.object({
  reference: z.string().trim().min(6).max(40).transform((v) => sanitizeText(v, 40)),
  identity: z.string().trim().min(3).max(120).transform((v) => sanitizeText(v, 120)),
  trackingToken: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = consumeRateLimit(`track:${ip}`, 30, 15 * 60 * 1000);
    if (!rl.allowed) return jsonError("Too many tracking lookups. Try later.", 429);

    const raw = await request.text();
    assertBodySize(raw);
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return jsonError("Enter a valid order reference and email or phone.");

    const order = trackOrder(
      parsed.data.reference.toUpperCase(),
      parsed.data.identity,
      parsed.data.trackingToken,
    );
    if (!order) {
      return jsonError("No matching order found for that reference and contact details.", 404);
    }

    return jsonOk({
      order: {
        reference: order.reference,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotalPkr: order.subtotalPkr,
        shippingPkr: order.shippingPkr,
        totalPkr: order.totalPkr,
        createdAt: order.createdAt,
        items: order.items.map((i) => ({
          name: i.productName,
          sku: i.sku,
          quantity: i.quantity,
          unitPricePkr: i.unitPricePkr,
          lineTotalPkr: i.lineTotalPkr,
          variantLabel: i.variantLabel,
        })),
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
