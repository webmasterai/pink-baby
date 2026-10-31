import { getSessionUser } from "@/lib/auth/session";
import { assertCsrf } from "@/lib/csrf";
import { getDb, newId, nowIso } from "@/lib/db";
import { getCatalogProductById } from "@/content/catalog";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { consumeRateLimit } from "@/lib/rate-limit-db";
import { getClientIp } from "@/lib/client-ip";
import { assertBodySize, reviewSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) return jsonError("productId required.");

    const rows = getDb()
      .prepare(
        `SELECT id, author_name AS authorName, rating, body, created_at AS createdAt
         FROM reviews WHERE product_id = ? AND status = 'approved'
         ORDER BY created_at DESC LIMIT 50`,
      )
      .all(productId);

    return jsonOk({ reviews: rows });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    const ip = getClientIp(request);
    const rl = consumeRateLimit(`review:${ip}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) return jsonError("Too many reviews. Try later.", 429);

    const raw = await request.text();
    assertBodySize(raw);
    const parsed = reviewSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid review.");
    }

    if (!getCatalogProductById(parsed.data.productId)) {
      return jsonError("Product not found.", 404);
    }

    const user = await getSessionUser();
    getDb()
      .prepare(
        `INSERT INTO reviews (id, product_id, user_id, author_name, rating, body, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      )
      .run(
        newId("rev"),
        parsed.data.productId,
        user?.id ?? null,
        parsed.data.authorName,
        parsed.data.rating,
        parsed.data.body,
        nowIso(),
      );

    return jsonOk({
      ok: true,
      message: "Thanks — your review was submitted for moderation.",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
