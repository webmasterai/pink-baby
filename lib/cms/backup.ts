import fs from "node:fs";
import path from "node:path";
import { getDb, nowIso } from "@/lib/db";
import { writeAudit } from "@/lib/cms/audit";
import { getBackupsDir, getDbPath } from "@/lib/paths";

const BACKUP_DIR = getBackupsDir();
const DB_PATH = getDbPath();

export function listBackups() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".sqlite"))
    .map((f) => {
      const abs = path.join(BACKUP_DIR, f);
      const st = fs.statSync(abs);
      return { name: f, size: st.size, createdAt: st.mtime.toISOString() };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createBackup(actorId: string) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  // Checkpoint WAL so backup is consistent enough for local ops
  try {
    getDb().exec("PRAGMA wal_checkpoint(TRUNCATE)");
  } catch {
    // ignore
  }
  const name = `pinkbaby-${nowIso().replace(/[:.]/g, "-")}.sqlite`;
  const dest = path.join(BACKUP_DIR, name);
  fs.copyFileSync(DB_PATH, dest);
  // also copy uploads snapshot marker
  writeAudit({
    actorId,
    action: "backup.create",
    entityType: "backup",
    entityId: name,
  });
  return { name, path: dest };
}

export function restoreBackup(name: string, actorId: string) {
  const safe = path.basename(name);
  if (safe !== name || !safe.endsWith(".sqlite")) {
    throw Object.assign(new Error("Invalid backup name."), { status: 400 });
  }
  const src = path.join(BACKUP_DIR, safe);
  if (!fs.existsSync(src)) {
    throw Object.assign(new Error("Backup not found."), { status: 404 });
  }
  createBackup(actorId); // safety snapshot before restore
  try {
    getDb().exec("PRAGMA wal_checkpoint(TRUNCATE)");
  } catch {
    // ignore
  }
  // Close is not available cleanly on DatabaseSync singleton; copy over file
  // and require process restart for full consistency.
  fs.copyFileSync(src, DB_PATH);
  writeAudit({
    actorId,
    action: "backup.restore",
    entityType: "backup",
    entityId: safe,
    meta: { requiresRestart: true },
  });
  return { restored: safe, requiresRestart: true };
}
