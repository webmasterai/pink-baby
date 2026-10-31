import { validateCartLines } from "@/lib/commerce/pricing";
import { getConfiguredShippingPkr } from "@/lib/commerce/settings";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { assertBodySize } from "@/lib/validation";
import { z } from "zod";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).max(99),
        variantKey: z.string().optional(),
        claimedUnitPrice: z.number().optional().nullable(),
      }),
    )
    .max(50),
});

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    assertBodySize(raw, 20_000);
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return jsonError("Invalid cart payload.");

    const result = validateCartLines(parsed.data.items);
    const shipping = getConfiguredShippingPkr();
    return jsonOk({
      ...result,
      shippingPkr: shipping,
      shippingConfigured: shipping != null,
      totalPkr: result.subtotalPkr + (shipping ?? 0),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
