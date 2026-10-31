import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const CSRF_COOKIE = "pb_csrf";
export const CSRF_HEADER = "x-csrf-token";

function secret(): string {
  const s = process.env.CSRF_SECRET || process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CSRF_SECRET or AUTH_SECRET must be set in production.");
    }
    return "dev-only-csrf-secret-change-me";
  }
  return s;
}

function sign(token: string): string {
  return createHmac("sha256", secret()).update(token).digest("base64url");
}

export function createCsrfToken(): string {
  const raw = randomBytes(24).toString("base64url");
  return `${raw}.${sign(raw)}`;
}

export function verifyCsrfToken(token: string | null | undefined): boolean {
  if (!token || !token.includes(".")) return false;
  const [raw, sig] = token.split(".");
  if (!raw || !sig) return false;
  const expected = sign(raw);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function ensureCsrfCookie(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CSRF_COOKIE)?.value;
  if (existing && verifyCsrfToken(existing)) return existing;
  const token = createCsrfToken();
  jar.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return token;
}

export async function assertCsrf(request: Request): Promise<void> {
  const header = request.headers.get(CSRF_HEADER);
  const jar = await cookies();
  const cookie = jar.get(CSRF_COOKIE)?.value;
  if (!header || !cookie || header !== cookie || !verifyCsrfToken(cookie)) {
    throw new CsrfError();
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      const o = new URL(origin);
      if (o.host !== host) throw new CsrfError("Invalid origin.");
    } catch {
      throw new CsrfError("Invalid origin.");
    }
  }
}

export class CsrfError extends Error {
  status = 403;
  constructor(message = "Invalid CSRF token.") {
    super(message);
  }
}
