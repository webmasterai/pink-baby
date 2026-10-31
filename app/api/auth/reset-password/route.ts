import { createHash } from "node:crypto";
import { getClientIp } from "@/lib/client-ip";
import { assertPasswordStrength, hashPassword } from "@/lib/auth/password";
import { assertCsrf } from "@/lib/csrf";
import { getDb, nowIso, withTransaction } from "@/lib/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { consumeRateLimit } from "@/lib/rate-limit-db";
import { assertBodySize, resetPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    const ip = getClientIp(request);
    const rl = consumeRateLimit(`reset:${ip}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) return jsonError("Too many attempts. Try later.", 429);

    const raw = await request.text();
    assertBodySize(raw);
    const parsed = resetPasswordSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return jsonError("Invalid reset request.");

    const strength = assertPasswordStrength(parsed.data.password);
    if (strength) return jsonError(strength);

    const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
    const row = getDb()
      .prepare(
        `SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?`,
      )
      .get(tokenHash) as
      | { id: string; user_id: string; expires_at: string; used_at: string | null }
      | undefined;

    if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
      return jsonError("This reset link is invalid or has expired.", 400);
    }

    const passwordHash = await hashPassword(parsed.data.password);
    withTransaction(() => {
      getDb()
        .prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`)
        .run(passwordHash, nowIso(), row.user_id);
      getDb()
        .prepare(`UPDATE password_resets SET used_at = ? WHERE id = ?`)
        .run(nowIso(), row.id);
      getDb().prepare(`DELETE FROM sessions WHERE user_id = ?`).run(row.user_id);
    });

    return jsonOk({ ok: true, message: "Password updated. You can sign in now." });
  } catch (err) {
    return handleRouteError(err);
  }
}
