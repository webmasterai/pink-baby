import { requireUser } from "@/lib/auth/session";
import { assertCsrf } from "@/lib/csrf";
import { getDb, newId, nowIso, withTransaction } from "@/lib/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { addressSchema, assertBodySize } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = getDb()
      .prepare(
        `SELECT id, label, full_name AS fullName, phone, line1, line2, city, province,
                postal_code AS postalCode, is_default AS isDefault
         FROM addresses WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC`,
      )
      .all(user.id);
    return jsonOk({ addresses: rows });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    const user = await requireUser();
    const raw = await request.text();
    assertBodySize(raw);
    const parsed = addressSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid address.");
    }

    const db = getDb();
    const id = newId("addr");
    const now = nowIso();
    const isDefault = parsed.data.isDefault ? 1 : 0;

    withTransaction(() => {
      if (isDefault) {
        db.prepare(`UPDATE addresses SET is_default = 0 WHERE user_id = ?`).run(user.id);
      }
      db.prepare(
        `INSERT INTO addresses (
          id, user_id, label, full_name, phone, line1, line2, city, province, postal_code,
          is_default, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        user.id,
        parsed.data.label || null,
        parsed.data.fullName,
        parsed.data.phone,
        parsed.data.line1,
        parsed.data.line2 || null,
        parsed.data.city,
        parsed.data.province,
        parsed.data.postalCode || null,
        isDefault,
        now,
        now,
      );
    });

    return jsonOk({ ok: true, id });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    await assertCsrf(request);
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return jsonError("Address id required.");

    const result = getDb()
      .prepare(`DELETE FROM addresses WHERE id = ? AND user_id = ?`)
      .run(id, user.id);

    if (result.changes === 0) return jsonError("Address not found.", 404);
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
