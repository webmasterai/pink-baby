import { getClientIp } from "@/lib/client-ip";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroySession,
  setSessionCookie,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { isStaffRole } from "@/lib/cms/roles";
import { safeAdminReturnPath } from "@/lib/cms/safe-return";
import { assertCsrf } from "@/lib/csrf";
import { getDb } from "@/lib/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { consumeRateLimit } from "@/lib/rate-limit-db";
import { assertBodySize, loginSchema } from "@/lib/validation";
import { cookies } from "next/headers";
import { z } from "zod";

const bodySchema = loginSchema.extend({
  next: z.string().optional(),
});

/**
 * Admin-only login. Does not promote customers.
 * Replaces any existing session (including a customer cart session cookie)
 * with the staff user's session after role verification.
 */
export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    const ip = getClientIp(request);
    const rl = consumeRateLimit(`admin-login:${ip}`, 15, 15 * 60 * 1000);
    if (!rl.allowed) {
      return jsonError("Too many admin login attempts. Try later.", 429);
    }

    const raw = await request.text();
    assertBodySize(raw);
    const parsed = bodySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return jsonError("Invalid email or password.", 401);
    }

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

    if (!isStaffRole(row.role)) {
      return jsonError(
        "This account is not authorized for CMS access. Use an admin account created via the setup script.",
        403,
      );
    }

    if (process.env.SMTP_HOST && !row.email_verified_at) {
      return jsonError("Please verify your email before signing in.", 403);
    }

    // Replace prior session (e.g. customer) so roles cannot bleed across
    const jar = await cookies();
    const previous = jar.get(SESSION_COOKIE)?.value;
    if (previous) await destroySession(previous);

    const sessionToken = await createSession(row.id, {
      ip,
      userAgent: request.headers.get("user-agent"),
    });
    await setSessionCookie(sessionToken);

    return jsonOk({
      ok: true,
      next: safeAdminReturnPath(parsed.data.next),
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
