/**
 * Create or promote a local admin user for Pink Baby CMS.
 *
 * Usage:
 *   node scripts/create-admin.mjs --email admin@pinkbaby.local --password 'ChooseAStrongPass1!' --name 'Owner'
 *
 * Requires AUTH_SECRET in env for production-like runs (optional locally).
 */
import { createHash, randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1] || fallback;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const email = arg("email").trim().toLowerCase();
const password = arg("password");
const name = arg("name", "Admin");
const role = arg("role", "owner");

if (!email || !password || password.length < 10) {
  console.error(
    "Usage: node scripts/create-admin.mjs --email you@example.com --password 'min-10-chars' [--name Name] [--role owner|admin]",
  );
  process.exit(1);
}

const dbPath = path.join(process.cwd(), "data", "store", "pinkbaby.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

// Prefer project password hasher if available after build; otherwise local scrypt format matching lib/auth/password.ts
let passwordHash;
try {
  const mod = await import(pathToFileURL(path.join(process.cwd(), "lib/auth/password.ts")).href);
  // ts may not import — fall through
  if (mod?.hashPassword) passwordHash = await mod.hashPassword(password);
} catch {
  // use local
}

if (!passwordHash) {
  // Match bcryptjs used by the app if present
  try {
    const bcrypt = await import("bcryptjs");
    passwordHash = await bcrypt.hash(password, 12);
  } catch {
    passwordHash = hashPassword(password);
    console.warn("Fell back to scrypt hash; ensure app password verifier supports it.");
  }
}

const now = new Date().toISOString();
const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);

if (existing) {
  db.prepare(`UPDATE users SET password_hash = ?, name = ?, role = ?, updated_at = ? WHERE id = ?`).run(
    passwordHash,
    name,
    role,
    now,
    existing.id,
  );
  console.log(`Updated existing user ${email} → role=${role}`);
} else {
  const id = `usr_${randomBytes(16).toString("hex")}`;
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, phone, email_verified_at, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
  ).run(id, email, passwordHash, name, now, role, now, now);
  console.log(`Created ${role} user ${email}`);
}

console.log("Sign in at /account then open /admin");
console.log("Or set ADMIN_EMAILS in .env.local and register normally.");
