import fs from "node:fs";
import path from "node:path";
import { getDocument, saveDraft, publishDocument } from "@/lib/cms/documents";
import { getDb, newId, nowIso } from "@/lib/db";
import { getBackupsDir, getDbPath } from "@/lib/paths";
import type { MigrationConflict, MigrationContext } from "@/lib/cms/migrations/types";

function getByPath(obj: unknown, dotted: string): unknown {
  const parts = dotted.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function setByPath(obj: Record<string, unknown>, dotted: string, value: unknown) {
  const parts = dotted.split(".").filter(Boolean);
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    const next = cur[key];
    if (next == null || typeof next !== "object" || Array.isArray(next)) {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Update a single field on a CMS document when the live value still matches
 * `expectedPrevious`. Customized values are preserved and reported as conflicts.
 * Never touches orders/customers/inventory tables.
 */
export function patchPublishedDocumentField(input: {
  docKey: string;
  fieldPath: string;
  expectedPrevious: unknown;
  nextValue: unknown;
  ctx: MigrationContext;
  actorId?: string;
}): "applied" | "skipped" | "conflict" {
  const doc = getDocument(input.docKey);
  if (!doc?.published) {
    input.ctx.reportConflict({
      path: `${input.docKey}.${input.fieldPath}`,
      expected: input.expectedPrevious,
      actual: undefined,
      message: `Document ${input.docKey} is missing; field not applied.`,
    });
    return "conflict";
  }

  const published = structuredClone(doc.published) as Record<string, unknown>;
  const actual = getByPath(published, input.fieldPath);

  if (deepEqual(actual, input.nextValue)) {
    return "skipped";
  }

  if (!deepEqual(actual, input.expectedPrevious)) {
    const conflict: MigrationConflict = {
      path: `${input.docKey}.${input.fieldPath}`,
      expected: input.expectedPrevious,
      actual,
      message: `Live value differs from expected previous; preserved customized content.`,
    };
    input.ctx.reportConflict(conflict);
    return "conflict";
  }

  if (input.ctx.dryRun) return "applied";

  setByPath(published, input.fieldPath, input.nextValue);
  const actorId = input.actorId || "migration";
  const draft = saveDraft({
    docKey: input.docKey,
    payload: published,
    conflictToken: doc.conflictToken,
    actorId,
  });
  publishDocument({
    docKey: input.docKey,
    conflictToken: draft.conflictToken,
    actorId,
  });
  return "applied";
}

export function backupSqliteForMigration(migrationId: string): string {
  const dir = getBackupsDir();
  fs.mkdirSync(dir, { recursive: true });
  try {
    getDb().exec("PRAGMA wal_checkpoint(TRUNCATE)");
  } catch {
    // ignore
  }
  const name = `pre-migrate-${migrationId}-${nowIso().replace(/[:.]/g, "-")}.sqlite`;
  const dest = path.join(dir, name);
  fs.copyFileSync(getDbPath(), dest);
  return dest;
}

export function restoreSqliteBackup(backupPath: string) {
  const dbPath = getDbPath();
  // Close is not exposed; overwrite after checkpoint best-effort
  try {
    getDb().exec("PRAGMA wal_checkpoint(TRUNCATE)");
  } catch {
    // ignore
  }
  fs.copyFileSync(backupPath, dbPath);
  // Drop WAL/SHM companions if present so the restored file is authoritative
  for (const suffix of ["-wal", "-shm"]) {
    const side = `${dbPath}${suffix}`;
    if (fs.existsSync(side)) fs.unlinkSync(side);
  }
}

export function listAppliedMigrationIds(): string[] {
  return (
    getDb()
      .prepare(
        `SELECT id FROM cms_content_migrations WHERE status = 'applied' ORDER BY applied_at ASC`,
      )
      .all() as { id: string }[]
  ).map((r) => r.id);
}

export function recordMigrationResult(input: {
  id: string;
  status: "applied" | "failed" | "skipped";
  checksum?: string;
  detail?: unknown;
}) {
  getDb()
    .prepare(
      `INSERT INTO cms_content_migrations (id, applied_at, checksum, status, detail_json)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         applied_at = excluded.applied_at,
         checksum = excluded.checksum,
         status = excluded.status,
         detail_json = excluded.detail_json`,
    )
    .run(
      input.id,
      nowIso(),
      input.checksum ?? null,
      input.status,
      input.detail != null ? JSON.stringify(input.detail) : null,
    );
}

export function migrationAlreadyApplied(id: string): boolean {
  const row = getDb()
    .prepare(`SELECT status FROM cms_content_migrations WHERE id = ?`)
    .get(id) as { status: string } | undefined;
  return row?.status === "applied";
}

export { newId };
