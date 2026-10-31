import { requireUser } from "@/lib/auth/session";
import { assertCsrf } from "@/lib/csrf";
import { getDb, newId, nowIso, withTransaction } from "@/lib/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { assertBodySize } from "@/lib/validation";
import { z } from "zod";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(99),
        variantKey: z.string().max(200).optional(),
      }),
    )
    .max(50),
});

export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    const user = await requireUser();
    const raw = await request.text();
    assertBodySize(raw, 20_000);
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return jsonError("Invalid cart payload.");

    const db = getDb();
    const upsert = db.prepare(`
      INSERT INTO cart_items (id, user_id, product_id, variant_key, quantity, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, product_id, variant_key) DO UPDATE SET
        quantity = MIN(99, cart_items.quantity + excluded.quantity),
        updated_at = excluded.updated_at
    `);

    withTransaction(() => {
      for (const item of parsed.data.items) {
        upsert.run(
          newId("ci"),
          user.id,
          item.productId,
          item.variantKey || "",
          item.quantity,
          nowIso(),
        );
      }
    });

    const rows = db
      .prepare(
        `SELECT product_id AS productId, variant_key AS variantKey, quantity
         FROM cart_items WHERE user_id = ?`,
      )
      .all(user.id) as { productId: string; variantKey: string; quantity: number }[];

    return jsonOk({
      ok: true,
      items: rows.map((r) => ({
        productId: r.productId,
        quantity: r.quantity,
        variantKey: r.variantKey || undefined,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const rows = getDb()
      .prepare(
        `SELECT product_id AS productId, variant_key AS variantKey, quantity
         FROM cart_items WHERE user_id = ?`,
      )
      .all(user.id) as { productId: string; variantKey: string; quantity: number }[];
    return jsonOk({
      items: rows.map((r) => ({
        productId: r.productId,
        quantity: r.quantity,
        variantKey: r.variantKey || undefined,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
