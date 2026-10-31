import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import { getDbPath, getStoreDir } from "@/lib/paths";

declare global {
  // eslint-disable-next-line no-var
  var __pbDb: DatabaseSync | undefined;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email_verified_at TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      user_agent TEXT,
      ip TEXT
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      postal_code TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      variant_key TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, product_id, variant_key)
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'PKR',
      subtotal_pkr INTEGER NOT NULL,
      shipping_pkr INTEGER NOT NULL,
      total_pkr INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_json TEXT NOT NULL,
      notes TEXT,
      idempotency_key TEXT UNIQUE,
      tracking_token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      product_slug TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT,
      variant_label TEXT,
      unit_price_pkr INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      line_total_pkr INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      window_start TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, status);

    CREATE TABLE IF NOT EXISTS cms_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cms_content_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL,
      checksum TEXT,
      status TEXT NOT NULL,
      detail_json TEXT
    );

    CREATE TABLE IF NOT EXISTS cms_documents (
      doc_key TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      published_json TEXT,
      draft_json TEXT,
      conflict_token TEXT NOT NULL,
      published_revision INTEGER NOT NULL DEFAULT 0,
      draft_revision INTEGER NOT NULL DEFAULT 0,
      updated_by TEXT,
      updated_at TEXT NOT NULL,
      published_at TEXT,
      published_by TEXT
    );

    CREATE TABLE IF NOT EXISTS cms_revisions (
      id TEXT PRIMARY KEY,
      doc_key TEXT NOT NULL,
      revision INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS cms_products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      sku TEXT,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      available INTEGER NOT NULL DEFAULT 1,
      featured INTEGER NOT NULL DEFAULT 0,
      primary_category_slug TEXT,
      payload_json TEXT NOT NULL,
      stock_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cms_categories (
      id TEXT PRIMARY KEY,
      source_id INTEGER,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      parent_slug TEXT,
      description TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      nav_order INTEGER NOT NULL DEFAULT 0,
      visible INTEGER NOT NULL DEFAULT 1,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      alt TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'contact',
      status TEXT NOT NULL DEFAULT 'new',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      status TEXT NOT NULL DEFAULT 'subscribed',
      source TEXT NOT NULL DEFAULT 'website',
      consent_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS redirects (
      id TEXT PRIMARY KEY,
      from_path TEXT NOT NULL UNIQUE,
      to_path TEXT NOT NULL,
      status_code INTEGER NOT NULL DEFAULT 301,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      meta_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cms_products_status ON cms_products(status);
    CREATE INDEX IF NOT EXISTS idx_cms_categories_parent ON cms_categories(parent_slug);
    CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
  `);

  // Ensure reviews table has moderation notes column for CMS
  try {
    db.exec(`ALTER TABLE reviews ADD COLUMN notes TEXT NOT NULL DEFAULT ''`);
  } catch {
    // column already exists
  }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN admin_notes TEXT NOT NULL DEFAULT ''`);
  } catch {
    // column already exists
  }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN tracking_code TEXT`);
  } catch {
    // column already exists
  }
}

export function getDb(): DatabaseSync {
  if (globalThis.__pbDb) return globalThis.__pbDb;
  const storeDir = getStoreDir();
  const dbPath = getDbPath();
  fs.mkdirSync(storeDir, { recursive: true });
  const db = new DatabaseSync(dbPath);
  migrate(db);
  globalThis.__pbDb = db;
  return db;
}

/** Drop the cached connection (e.g. after restoring a SQLite file from backup). */
export function resetDbConnection() {
  const db = globalThis.__pbDb as { close?: () => void } | undefined;
  try {
    db?.close?.();
  } catch {
    // ignore
  }
  globalThis.__pbDb = undefined;
}

export function newId(prefix = ""): string {
  const id = crypto.randomUUID().replace(/-/g, "");
  return prefix ? `${prefix}_${id}` : id;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** node:sqlite DatabaseSync has no .transaction(); use explicit BEGIN/COMMIT. */
export function withTransaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    throw err;
  }
}
