import path from "node:path";

/**
 * Persistent data root.
 * - Local default: `<cwd>/data`
 * - Coolify/Docker: set `DATA_DIR=/data` and mount the volume at `/data`
 *   (never mount over `/app` or `.next`).
 */
export function getDataRoot(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

export function getStoreDir(): string {
  return path.join(getDataRoot(), "store");
}

export function getDbPath(): string {
  return path.join(getStoreDir(), "pinkbaby.sqlite");
}

export function getUploadsDir(): string {
  return path.join(getDataRoot(), "uploads");
}

export function getBackupsDir(): string {
  return path.join(getDataRoot(), "backups");
}

export function getMigrationLockPath(): string {
  return path.join(getDataRoot(), "cms-migrate.lock");
}
