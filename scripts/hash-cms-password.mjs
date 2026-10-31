#!/usr/bin/env node
/**
 * Interactive bcrypt hash generator for CMS_ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   npm run cms:hash-password
 *
 * Never put a plaintext password into CMS_ADMIN_PASSWORD_HASH.
 * Paste only the printed hash into Coolify / .env.
 */
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output, stderr } from "node:process";
import bcrypt from "bcryptjs";

const ROUNDS = 12;
const BCRYPT_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

function strengthError(password) {
  if (password.length < 10) return "Password must be at least 10 characters.";
  if (password.length > 128) return "Password is too long.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include letters and numbers.";
  }
  return null;
}

async function main() {
  const rl = createInterface({ input, output, terminal: true });
  try {
    stderr.write(
      "\nPink Baby — CMS password hash generator\n" +
        "The plaintext password is never written to disk or .env.\n" +
        "Only the bcrypt hash below belongs in CMS_ADMIN_PASSWORD_HASH.\n\n",
    );

    const password = await rl.question("Enter CMS admin password: ");
    const confirm = await rl.question("Confirm password: ");

    if (password !== confirm) {
      stderr.write("Passwords do not match.\n");
      process.exitCode = 1;
      return;
    }

    const err = strengthError(password);
    if (err) {
      stderr.write(`${err}\n`);
      process.exitCode = 1;
      return;
    }

    const hash = await bcrypt.hash(password, ROUNDS);
    if (!BCRYPT_RE.test(hash)) {
      stderr.write("Unexpected hash format from bcrypt — aborting.\n");
      process.exitCode = 1;
      return;
    }

    const sessionSecret = randomBytes(48).toString("base64url");

    output.write("\n# Coolify / server environment (secrets — do not commit)\n");
    output.write(`CMS_ADMIN_PASSWORD_HASH=${hash}\n`);
    output.write(
      `# Also set CMS_ADMIN_USERNAME to your chosen username or email\n`,
    );
    output.write(`CMS_SESSION_SECRET=${sessionSecret}\n`);
    output.write(
      "\n# AUTH_SECRET and CSRF_SECRET remain required for storefront CSRF.\n",
    );
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
