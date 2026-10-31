import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/auth/session";
import { getCmsEnvAuthConfig } from "@/lib/cms/env-auth";

export const CMS_SESSION_COOKIE = "pb_cms_session";
const SESSION_DAYS = 14;
const CMS_ADMIN_ID = "cms-env-admin";

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function buildCmsAdminUser(username: string): SessionUser {
  const looksEmail = username.includes("@");
  return {
    id: CMS_ADMIN_ID,
    email: looksEmail ? username.toLowerCase() : `${username}@cms.local`,
    name: "CMS Admin",
    phone: null,
    role: "owner",
    emailVerifiedAt: new Date(0).toISOString(),
  };
}

export async function createCmsSessionToken(username: string): Promise<string> {
  const config = getCmsEnvAuthConfig();
  if (!config) {
    throw new Error("CMS authentication is not configured.");
  }

  return new SignJWT({
    username: config.username,
    role: "owner",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(CMS_ADMIN_ID)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey(config.sessionSecret));
}

export async function setCmsSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(CMS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearCmsSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(CMS_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function verifyCmsSessionToken(
  token: string,
): Promise<SessionUser | null> {
  const config = getCmsEnvAuthConfig();
  if (!config) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(config.sessionSecret), {
      algorithms: ["HS256"],
    });
    if (payload.sub !== CMS_ADMIN_ID) return null;
    const username =
      typeof payload.username === "string" ? payload.username : config.username;
    return buildCmsAdminUser(username);
  } catch {
    return null;
  }
}

/** Server-only CMS admin from signed cookie (independent of storefront SQLite sessions). */
export async function getCmsSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(CMS_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyCmsSessionToken(token);
}
