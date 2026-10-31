import { getClientIp } from "@/lib/client-ip";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  setSessionCookie,
} from "@/lib/auth/session";
import { assertCsrf } from "@/lib/csrf";
import { getDb } from "@/lib/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { consumeRateLimit } from "@/lib/rate-limit-db";
import { assertBodySize, loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    const ip = getClientIp(request);
    const rl = consumeRateLimit(`login:${ip}`, 20, 15 * 60 * 1000);
    if (!rl.allowed) return jsonError("Too many login attempts. Try later.", 429);

    const raw = await request.text();
    assertBodySize(raw);
    const parsed = loginSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return jsonError("Invalid email or password.", 401);

    const row = getDb()
      .prepare(
        `SELECT id, email, name, role, password_hash, email_verified_at FROM users WHERE email = ?`,
      )
      .get(parsed.data.email) as
      | {
          id: string;
          email: string;
          name: string;
          role: string;
          password_hash: string;
          email_verified_at: string | null;
        }
      | undefined;

    if (!row || !(await verifyPassword(parsed.data.password, row.password_hash))) {
      return jsonError("Invalid email or password.", 401);
    }

    if (process.env.SMTP_HOST && !row.email_verified_at) {
      return jsonError("Please verify your email before signing in.", 403);
    }

    const sessionToken = await createSession(row.id, {
      ip,
      userAgent: request.headers.get("user-agent"),
    });
    await setSessionCookie(sessionToken);

    return jsonOk({
      ok: true,
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        emailVerified: Boolean(row.email_verified_at),
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
