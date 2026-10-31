import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  backupSqliteForMigration,
  listAppliedMigrationIds,
  migrationAlreadyApplied,
  recordMigrationResult,
  restoreSqliteBackup,
} from "@/lib/cms/migrations/helpers";
import { contentMigrations } from "@/lib/cms/migrations/registry";
import type { ContentMigration, MigrationConflict } from "@/lib/cms/migrations/types";
import { getDb, resetDbConnection } from "@/lib/db";
import { getMigrationLockPath } from "@/lib/paths";

export type RunMigrationsResult = {
  applied: string[];
  skipped: string[];
  conflicts: MigrationConflict[];
  dryRun: boolean;
};

function checksumOf(m: ContentMigration): string {
  return createHash("sha256")
    .update(m.id)
    .update(m.description)
    .digest("hex")
    .slice(0, 16);
}

function acquireLock(): () => void {
  const lockPath = getMigrationLockPath();
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  const staleMs = 15 * 60 * 1000;
  if (fs.existsSync(lockPath)) {
    const age = Date.now() - fs.statSync(lockPath).mtimeMs;
    if (age > staleMs) {
      try {
        fs.unlinkSync(lockPath);
      } catch {
        // ignore
      }
    }
  }
  let fd: number;
  try {
    fd = fs.openSync(lockPath, "wx");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EEXIST") {
      throw new Error(
        "Another CMS content migration is already running (lock file present). Retry shortly.",
      );
    }
    throw err;
  }
  fs.writeFileSync(lockPath, `${process.pid}\n${new Date().toISOString()}\n`);
  return () => {
    try {
      fs.closeSync(fd);
    } catch {
      // ignore
    }
    try {
      fs.unlinkSync(lockPath);
    } catch {
      // ignore
    }
  };
}

function revalidateAfterMigrations() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { revalidatePath } = require("next/cache") as typeof import("next/cache");
    revalidatePath("/", "layout");
    revalidatePath("/");
  } catch {
    // Outside Next request context — OK at cold start
  }
}

export async function runContentMigrations(opts?: {
  dryRun?: boolean;
  migrations?: ContentMigration[];
}): Promise<RunMigrationsResult> {
  const dryRun = Boolean(opts?.dryRun || process.env.CMS_MIGRATE_DRY_RUN === "1");
  const migrations = opts?.migrations ?? contentMigrations;
  const release = acquireLock();
  const applied: string[] = [];
  const skipped: string[] = [];
  const conflicts: MigrationConflict[] = [];

  try {
    getDb();

    for (const migration of migrations) {
      if (migrationAlreadyApplied(migration.id)) {
        skipped.push(migration.id);
        continue;
      }

      const migrationConflicts: MigrationConflict[] = [];
      const reportConflict = (c: MigrationConflict) => {
        migrationConflicts.push(c);
        conflicts.push(c);
      };

      let backupPath: string | null = null;
      try {
        if (!dryRun) {
          backupPath = backupSqliteForMigration(migration.id);
        }

        await migration.up({ dryRun, reportConflict });

        if (!dryRun) {
          recordMigrationResult({
            id: migration.id,
            status: "applied",
            checksum: checksumOf(migration),
            detail: { conflicts: migrationConflicts },
          });
        }
        applied.push(migration.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!dryRun) {
          recordMigrationResult({
            id: migration.id,
            status: "failed",
            checksum: checksumOf(migration),
            detail: { error: message, backupPath },
          });
          if (backupPath && fs.existsSync(backupPath)) {
            try {
              restoreSqliteBackup(backupPath);
              resetDbConnection();
              getDb();
            } catch (restoreErr) {
              const rmsg =
                restoreErr instanceof Error ? restoreErr.message : String(restoreErr);
              throw new Error(
                `Migration ${migration.id} failed (${message}) and backup restore also failed (${rmsg}). Backup: ${backupPath}`,
              );
            }
          }
        }
        throw new Error(`CMS content migration failed: ${migration.id} — ${message}`);
      }
    }

    if (!dryRun && applied.length > 0) {
      revalidateAfterMigrations();
    }

    return { applied, skipped, conflicts, dryRun };
  } finally {
    release();
  }
}

export function getMigrationStatus() {
  getDb();
  return {
    registered: contentMigrations.map((m) => m.id),
    applied: listAppliedMigrationIds(),
  };
}
