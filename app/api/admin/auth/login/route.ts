import { getClientIp } from "@/lib/client-ip";
import {
  createCmsSessionToken,
  setCmsSessionCookie,
} from "@/lib/cms/cms-session";
import {
  getCmsEnvAuthConfig,
  verifyCmsEnvCredentials,
} from "@/lib/cms/env-auth";
import { safeAdminReturnPath } from "@/lib/cms/safe-return";
import { assertCsrf } from "@/lib/csrf";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { consumeRateLimit } from "@/lib/rate-limit-db";
import { assertBodySize, adminLoginSchema } from "@/lib/validation";

/**
 * Admin-only login against server env credentials
 * (CMS_ADMIN_USERNAME + CMS_ADMIN_PASSWORD_HASH).
 * Issues a CMS session signed with CMS_SESSION_SECRET.
 * Does not touch SQLite users / customer ecommerce sessions.
 */
export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    const ip = getClientIp(request);
    const rl = consumeRateLimit(`admin-login:${ip}`, 15, 15 * 60 * 1000);
    if (!rl.allowed) {
      return jsonError("Too many admin login attempts. Try later.", 429);
    }

    const config = getCmsEnvAuthConfig();
    if (!config) {
      return jsonError(
        "CMS authentication is not configured on this server.",
        503,
      );
    }

    const raw = await request.text();
    assertBodySize(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid username or password.", 401);
    }

    const username = parsed.data.username;
    const ok = await verifyCmsEnvCredentials(username, parsed.data.password);
    if (!ok) {
      return jsonError("Invalid username or password.", 401);
    }

    const token = await createCmsSessionToken(username.trim());
    await setCmsSessionCookie(token);

    const next =
      typeof body.next === "string" ? body.next : undefined;

    return jsonOk({
      ok: true,
      next: safeAdminReturnPath(next),
      user: {
        id: "cms-env-admin",
        email: username.includes("@")
          ? username.trim().toLowerCase()
          : `${username.trim()}@cms.local`,
        name: "CMS Admin",
        role: "owner",
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
