import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

/**
 * Migrations mutate SQLite; run each scenario in an isolated subprocess with its
 * own DATA_DIR so the developer DB and other test files stay untouched.
 * Case files live under tests/.tmp-mig so relative ../lib imports resolve.
 */
function runIsolated(scriptBody: string) {
  const root = process.cwd();
  const casesDir = path.join(root, "tests", ".tmp-mig");
  fs.mkdirSync(casesDir, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(casesDir, "data-"));
  const file = path.join(casesDir, `case-${process.pid}-${Date.now()}.mts`);
  fs.writeFileSync(
    file,
    `
process.env.DATA_DIR = ${JSON.stringify(dataDir)};
process.env.CMS_BOOTSTRAP = "1";
process.env.NODE_ENV = "test";
${scriptBody}
`,
  );
  const result = spawnSync(process.execPath, ["--import", "tsx", file], {
    encoding: "utf8",
    cwd: root,
  });
  const cleanup = () => {
    try {
      fs.unlinkSync(file);
    } catch {
      // ignore
    }
    try {
      fs.rmSync(dataDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  };
  if (result.status !== 0) {
    cleanup();
    throw new Error(
      `isolated migration case failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
  cleanup();
  return result.stdout;
}

describe("cms content migrations", () => {
  it("applies once then skips", () => {
    runIsolated(`
import assert from "node:assert/strict";
import { getDb, resetDbConnection } from "../../lib/db.ts";
import { ensureDocument, getPublishedPayload } from "../../lib/cms/documents.ts";
import { runContentMigrations } from "../../lib/cms/migrations/runner.ts";
import { patchPublishedDocumentField, migrationAlreadyApplied } from "../../lib/cms/migrations/helpers.ts";

resetDbConnection();
getDb();
ensureDocument("home", "Homepage", {
  promo: { heading: "Old heading", text: "t", cta: "c", ctaHref: "/", image: "/x.png" },
});
const mig = {
  id: "test-promo-heading-v1",
  description: "Update promo heading when still old",
  up(ctx) {
    patchPublishedDocumentField({
      docKey: "home",
      fieldPath: "promo.heading",
      expectedPrevious: "Old heading",
      nextValue: "New heading",
      ctx,
    });
  },
};
const first = await runContentMigrations({ migrations: [mig] });
assert.deepEqual(first.applied, ["test-promo-heading-v1"]);
assert.equal(getPublishedPayload("home").promo.heading, "New heading");
assert.equal(migrationAlreadyApplied("test-promo-heading-v1"), true);
const second = await runContentMigrations({ migrations: [mig] });
assert.deepEqual(second.applied, []);
assert.deepEqual(second.skipped, ["test-promo-heading-v1"]);
console.log("OK apply-once");
`);
  });

  it("preserves customized values as conflicts", () => {
    runIsolated(`
import assert from "node:assert/strict";
import { getDb, resetDbConnection } from "../../lib/db.ts";
import { ensureDocument, getPublishedPayload } from "../../lib/cms/documents.ts";
import { runContentMigrations } from "../../lib/cms/migrations/runner.ts";
import { patchPublishedDocumentField } from "../../lib/cms/migrations/helpers.ts";

resetDbConnection();
getDb();
ensureDocument("home", "Homepage", {
  promo: { heading: "Custom live", text: "t", cta: "c", ctaHref: "/", image: "/x.png" },
});
const mig = {
  id: "test-promo-heading-conflict",
  description: "conflict",
  up(ctx) {
    patchPublishedDocumentField({
      docKey: "home",
      fieldPath: "promo.heading",
      expectedPrevious: "Old heading",
      nextValue: "Should not win",
      ctx,
    });
  },
};
const result = await runContentMigrations({ migrations: [mig] });
assert.ok(result.conflicts.length >= 1);
assert.equal(getPublishedPayload("home").promo.heading, "Custom live");
console.log("OK conflict");
`);
  });

  it("dry run makes no changes", () => {
    runIsolated(`
import assert from "node:assert/strict";
import { getDb, resetDbConnection } from "../../lib/db.ts";
import { ensureDocument, getDocument, getPublishedPayload } from "../../lib/cms/documents.ts";
import { runContentMigrations } from "../../lib/cms/migrations/runner.ts";
import { patchPublishedDocumentField, migrationAlreadyApplied } from "../../lib/cms/migrations/helpers.ts";

resetDbConnection();
getDb();
ensureDocument("site", "Site", { name: "Pink Baby", tagline: "keep" });
const before = getDocument("site");
const mig = {
  id: "test-dry-run-site-tagline",
  description: "dry",
  up(ctx) {
    patchPublishedDocumentField({
      docKey: "site",
      fieldPath: "tagline",
      expectedPrevious: "keep",
      nextValue: "changed",
      ctx,
    });
  },
};
const result = await runContentMigrations({ migrations: [mig], dryRun: true });
assert.equal(result.dryRun, true);
assert.equal(migrationAlreadyApplied("test-dry-run-site-tagline"), false);
assert.equal(getPublishedPayload("site").tagline, "keep");
assert.equal(getDocument("site").conflictToken, before.conflictToken);
console.log("OK dry-run");
`);
  });

  it("failed migration is not marked applied", () => {
    runIsolated(`
import assert from "node:assert/strict";
import { getDb, resetDbConnection } from "../../lib/db.ts";
import { ensureDocument, getPublishedPayload } from "../../lib/cms/documents.ts";
import { runContentMigrations } from "../../lib/cms/migrations/runner.ts";
import { migrationAlreadyApplied } from "../../lib/cms/migrations/helpers.ts";

resetDbConnection();
getDb();
ensureDocument("home", "Homepage", {
  promo: { heading: "Safe", text: "t", cta: "c", ctaHref: "/", image: "/x.png" },
});
const mig = {
  id: "test-failing-migration",
  description: "throws",
  up() { throw new Error("boom"); },
};
let failed = false;
try {
  await runContentMigrations({ migrations: [mig] });
} catch (e) {
  failed = String(e).includes("boom");
}
assert.equal(failed, true);
assert.equal(migrationAlreadyApplied("test-failing-migration"), false);
assert.equal(getPublishedPayload("home").promo.heading, "Safe");
console.log("OK fail");
`);
  });

  it("concurrent lock rejects second runner", () => {
    runIsolated(`
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getDb, resetDbConnection } from "../../lib/db.ts";
import { runContentMigrations } from "../../lib/cms/migrations/runner.ts";

resetDbConnection();
getDb();
const lockPath = path.join(process.env.DATA_DIR, "cms-migrate.lock");
fs.writeFileSync(lockPath, "fake\\n");
let rejected = false;
try {
  await runContentMigrations({ migrations: [{ id: "test-lock", description: "x", up() {} }] });
} catch (e) {
  rejected = /already running/.test(String(e));
}
assert.equal(rejected, true);
fs.unlinkSync(lockPath);
console.log("OK lock");
`);
  });

  it("document patch leaves orders untouched", () => {
    runIsolated(`
import assert from "node:assert/strict";
import { getDb, resetDbConnection } from "../../lib/db.ts";
import { ensureDocument } from "../../lib/cms/documents.ts";
import { runContentMigrations } from "../../lib/cms/migrations/runner.ts";
import { patchPublishedDocumentField } from "../../lib/cms/migrations/helpers.ts";

resetDbConnection();
getDb();
ensureDocument("home", "Homepage", {
  promo: { heading: "H", text: "t", cta: "c", ctaHref: "/", image: "/x.png" },
});
getDb().prepare(\`INSERT INTO orders
  (id, reference, user_id, status, payment_method, payment_status, currency,
   subtotal_pkr, shipping_pkr, total_pkr, customer_name, customer_email, customer_phone,
   shipping_json, tracking_token_hash, created_at, updated_at)
  VALUES ('ord_mig_test', 'PB-MIG', NULL, 'pending', 'cod', 'unpaid', 'PKR',
   100, 0, 100, 'Test', 't@example.com', '0300',
   '{}', 'hash', datetime('now'), datetime('now'))\`).run();
await runContentMigrations({
  migrations: [{
    id: "test-orders-untouched",
    description: "patch home only",
    up(ctx) {
      patchPublishedDocumentField({
        docKey: "home",
        fieldPath: "promo.text",
        expectedPrevious: "t",
        nextValue: "t2",
        ctx,
      });
    },
  }],
});
const row = getDb().prepare("SELECT reference, total_pkr AS total FROM orders WHERE id = ?").get("ord_mig_test");
assert.equal(row.reference, "PB-MIG");
assert.equal(row.total, 100);
console.log("OK orders");
`);
  });
});
