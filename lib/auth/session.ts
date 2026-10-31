import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getDb, newId, nowIso } from "@/lib/db";

export const SESSION_COOKIE = "pb_session";
const SESSION_DAYS = 14;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "customer" | "admin" | "owner" | "editor" | "order_manager";
  emailVerifiedAt: string | null;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(
  userId: string,
  meta?: { userAgent?: string | null; ip?: string | null },
): Promise<string> {
  const db = getDb();
  const token = createSessionToken();
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, user_agent, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    newId("sess"),
    userId,
    hashToken(token),
    expires.toISOString(),
    nowIso(),
    meta?.userAgent ?? null,
    meta?.ip ?? null,
  );
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function destroySession(token?: string | null): Promise<void> {
  if (!token) return;
  getDb()
    .prepare(`DELETE FROM sessions WHERE token_hash = ?`)
    .run(hashToken(token));
}

/** Keep the current session; invalidate every other session for this user. */
export function destroyOtherSessions(userId: string, keepToken: string) {
  getDb()
    .prepare(`DELETE FROM sessions WHERE user_id = ? AND token_hash != ?`)
    .run(userId, hashToken(keepToken));
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.phone, u.role, u.email_verified_at AS emailVerifiedAt,
              s.expires_at AS expiresAt
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?
       LIMIT 1`,
    )
    .get(hashToken(token)) as
    | {
        id: string;
        email: string;
        name: string;
        phone: string | null;
        role: string;
        emailVerifiedAt: string | null;
        expiresAt: string;
      }
    | undefined;

  if (!row) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    await destroySession(token);
    return null;
  }

  const staffRoles = new Set(["admin", "owner", "editor", "order_manager"]);
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: staffRoles.has(row.role)
      ? (row.role as SessionUser["role"])
      : "customer",
    emailVerifiedAt: row.emailVerifiedAt,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Authentication required.", 401);
  return user;
}

/**
 * CMS authorization uses the env-backed CMS session cookie only.
 * Storefront SQLite customer/staff sessions never grant /admin access.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const { getCmsSessionUser } = await import("@/lib/cms/cms-session");
  const user = await getCmsSessionUser();
  if (!user) throw new AuthError("Admin access required.", 401);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
