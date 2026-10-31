import { requireUser } from "@/lib/auth/session";
import { assertCsrf } from "@/lib/csrf";
import { getDb, newId, nowIso, withTransaction } from "@/lib/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { assertBodySize } from "@/lib/validation";
import { z } from "zod";

const schema = z.object({
  productIds: z.array(z.string().min(1).max(64)).max(200),
});

export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    const user = await requireUser();
    const raw = await request.text();
    assertBodySize(raw, 20_000);
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return jsonError("Invalid wishlist payload.");

    const db = getDb();
    const insert = db.prepare(`
      INSERT OR IGNORE INTO wishlist_items (id, user_id, product_id, created_at)
      VALUES (?, ?, ?, ?)
    `);
    withTransaction(() => {
      for (const productId of parsed.data.productIds) {
        insert.run(newId("wi"), user.id, productId, nowIso());
      }
    });

    const rows = db
      .prepare(`SELECT product_id AS productId FROM wishlist_items WHERE user_id = ?`)
      .all(user.id) as { productId: string }[];

    return jsonOk({ ok: true, productIds: rows.map((r) => r.productId) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const rows = getDb()
      .prepare(`SELECT product_id AS productId FROM wishlist_items WHERE user_id = ?`)
      .all(user.id) as { productId: string }[];
    return jsonOk({ productIds: rows.map((r) => r.productId) });
  } catch (err) {
    return handleRouteError(err);
  }
}
