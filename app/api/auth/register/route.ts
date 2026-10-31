import { getClientIp } from "@/lib/client-ip";
import { assertPasswordStrength, hashPassword } from "@/lib/auth/password";
import {
  createSession,
  setSessionCookie,
} from "@/lib/auth/session";
import { assertCsrf } from "@/lib/csrf";
import { getDb, newId, nowIso } from "@/lib/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { consumeRateLimit } from "@/lib/rate-limit-db";
import { assertBodySize, registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    const ip = getClientIp(request);
    const rl = consumeRateLimit(`register:${ip}`, 8, 60 * 60 * 1000);
    if (!rl.allowed) return jsonError("Too many registration attempts. Try later.", 429);

    const raw = await request.text();
    assertBodySize(raw);
    const parsed = registerSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid input.");
    }

    const strength = assertPasswordStrength(parsed.data.password);
    if (strength) return jsonError(strength);

    const db = getDb();
    const existing = db
      .prepare(`SELECT id FROM users WHERE email = ?`)
      .get(parsed.data.email);
    if (existing) return jsonError("An account with this email already exists.", 409);

    const id = newId("usr");
    const now = nowIso();
    // Never auto-promote from registration — staff are created via create-admin script only.
    const role = "customer";
    const passwordHash = await hashPassword(parsed.data.password);

    // Email verification required when SMTP is configured; otherwise mark verified for local ops.
    const emailVerifiedAt = process.env.SMTP_HOST ? null : now;

    db.prepare(
      `INSERT INTO users (id, email, password_hash, name, phone, email_verified_at, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsed.data.email,
      passwordHash,
      parsed.data.name,
      parsed.data.phone || null,
      emailVerifiedAt,
      role,
      now,
      now,
    );

    if (process.env.SMTP_HOST) {
      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const { createHash } = await import("node:crypto");
      db.prepare(
        `INSERT INTO email_verifications (id, user_id, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(
        newId("ev"),
        id,
        createHash("sha256").update(token).digest("hex"),
        new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        now,
      );
      // Token is not emailed until SMTP is configured — surface in response for local testing only.
      if (process.env.NODE_ENV !== "production") {
        console.info("[auth] email verification token (dev):", token);
      }
    }

    const sessionToken = await createSession(id, {
      ip,
      userAgent: request.headers.get("user-agent"),
    });
    await setSessionCookie(sessionToken);

    return jsonOk({
      ok: true,
      user: {
        id,
        email: parsed.data.email,
        name: parsed.data.name,
        role,
        emailVerified: Boolean(emailVerifiedAt),
      },
      emailVerificationRequired: Boolean(process.env.SMTP_HOST) && !emailVerifiedAt,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
