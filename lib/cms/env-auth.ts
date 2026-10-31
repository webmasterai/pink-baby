import { createHash, timingSafeEqual } from "node:crypto";
import { verifyPassword } from "@/lib/auth/password";

/** bcrypt digests only — plaintext must never be stored in CMS_ADMIN_PASSWORD_HASH */
const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export const CMS_ENV_VAR_NAMES = [
  "CMS_ADMIN_USERNAME",
  "CMS_ADMIN_PASSWORD_HASH",
  "CMS_SESSION_SECRET",
] as const;

export type CmsEnvAuthConfig = {
  username: string;
  passwordHash: string;
  sessionSecret: string;
};

let loggedConfigIssue = false;

export function isBcryptPasswordHash(value: string): boolean {
  return BCRYPT_HASH_RE.test(value.trim());
}

function safeEqualUtf8(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a, "utf8").digest();
  const bh = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ah, bh);
}

function logConfigIssueOnce(message: string): void {
  if (loggedConfigIssue) return;
  loggedConfigIssue = true;
  console.error(message);
}

/**
 * Reads CMS admin env. Logs only missing / invalid variable NAMES (never values).
 * Returns null when incomplete or when the password field is not a bcrypt hash.
 */
export function getCmsEnvAuthConfig(): CmsEnvAuthConfig | null {
  const missing: string[] = [];
  const username = process.env.CMS_ADMIN_USERNAME?.trim() ?? "";
  const passwordHash = process.env.CMS_ADMIN_PASSWORD_HASH?.trim() ?? "";
  const sessionSecret = process.env.CMS_SESSION_SECRET?.trim() ?? "";

  if (!username) missing.push("CMS_ADMIN_USERNAME");
  if (!passwordHash) missing.push("CMS_ADMIN_PASSWORD_HASH");
  if (!sessionSecret) missing.push("CMS_SESSION_SECRET");

  if (missing.length) {
    logConfigIssueOnce(
      `[cms-auth] Missing required environment variable(s): ${missing.join(", ")}`,
    );
    return null;
  }

  if (!isBcryptPasswordHash(passwordHash)) {
    logConfigIssueOnce(
      "[cms-auth] CMS_ADMIN_PASSWORD_HASH must be a bcrypt hash (generate with npm run cms:hash-password). Plaintext passwords are rejected.",
    );
    return null;
  }

  if (sessionSecret.length < 32) {
    logConfigIssueOnce(
      "[cms-auth] CMS_SESSION_SECRET is too short (use at least 32 random characters).",
    );
    return null;
  }

  return { username, passwordHash, sessionSecret };
}

/** Test helper — reset one-shot config logging. */
export function resetCmsEnvAuthLogState(): void {
  loggedConfigIssue = false;
}

/**
 * Verifies CMS credentials against environment config.
 * Always runs a password check path to reduce timing leaks when username mismatches.
 */
export async function verifyCmsEnvCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const config = getCmsEnvAuthConfig();
  if (!config) return false;

  const usernameOk = safeEqualUtf8(username.trim(), config.username);
  const passwordOk = await verifyPassword(password, config.passwordHash);
  return usernameOk && passwordOk;
}
