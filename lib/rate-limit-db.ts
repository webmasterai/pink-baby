import { getDb, nowIso } from "@/lib/db";

/** Simple sliding fixed-window limiter persisted in SQLite. */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const db = getDb();
  const now = Date.now();
  const row = db
    .prepare(`SELECT count, window_start FROM rate_limits WHERE key = ?`)
    .get(key) as { count: number; window_start: string } | undefined;

  if (!row) {
    db.prepare(
      `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)`,
    ).run(key, nowIso());
    return { allowed: true, remaining: limit - 1 };
  }

  const start = new Date(row.window_start).getTime();
  if (now - start > windowMs) {
    db.prepare(
      `UPDATE rate_limits SET count = 1, window_start = ? WHERE key = ?`,
    ).run(nowIso(), key);
    return { allowed: true, remaining: limit - 1 };
  }

  if (row.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  db.prepare(`UPDATE rate_limits SET count = count + 1 WHERE key = ?`).run(key);
  return { allowed: true, remaining: limit - row.count - 1 };
}
