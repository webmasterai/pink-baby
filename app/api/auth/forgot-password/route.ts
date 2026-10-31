import { createHash, randomBytes } from "node:crypto";
import { getClientIp } from "@/lib/client-ip";
import { assertCsrf } from "@/lib/csrf";
import { getDb, newId, nowIso } from "@/lib/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { consumeRateLimit } from "@/lib/rate-limit-db";
import { assertBodySize, forgotPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    const ip = getClientIp(request);
    const rl = consumeRateLimit(`forgot:${ip}`, 8, 60 * 60 * 1000);
    if (!rl.allowed) return jsonError("Too many reset requests. Try later.", 429);

    const raw = await request.text();
    assertBodySize(raw);
    const parsed = forgotPasswordSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return jsonError("Please enter a valid email.");

    const user = getDb()
      .prepare(`SELECT id FROM users WHERE email = ?`)
      .get(parsed.data.email) as { id: string } | undefined;

    // Always return success to avoid account enumeration.
    if (user) {
      const token = randomBytes(32).toString("base64url");
      const expires = new Date(Date.now() + 1000 * 60 * 30).toISOString();
      getDb()
        .prepare(
          `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(
          newId("pr"),
          user.id,
          createHash("sha256").update(token).digest("hex"),
          expires,
          nowIso(),
        );

      if (process.env.SMTP_HOST) {
        // Email delivery pending SMTP configuration.
        console.info("[auth] password reset queued for", parsed.data.email);
      } else if (process.env.NODE_ENV !== "production") {
        console.info("[auth] password reset token (dev):", token);
      }

      return jsonOk({
        ok: true,
        message:
          "If an account exists for that email, reset instructions were issued.",
        // Dev-only helper when SMTP is not configured:
        ...(process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST
          ? { devResetToken: token }
          : {}),
      });
    }

    return jsonOk({
      ok: true,
      message:
        "If an account exists for that email, reset instructions were issued.",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
