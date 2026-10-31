import { getDb, newId, nowIso } from "@/lib/db";

export function writeAudit(input: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}) {
  const safeMeta = { ...(input.meta || {}) };
  for (const key of Object.keys(safeMeta)) {
    if (/pass|secret|token|credential|smtp|payment/i.test(key)) {
      delete safeMeta[key];
    }
  }
  getDb()
    .prepare(
      `INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, meta_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      newId("aud"),
      input.actorId,
      input.action,
      input.entityType,
      input.entityId ?? null,
      JSON.stringify(safeMeta),
      nowIso(),
    );
}

export function listAudit(limit = 100) {
  return (
    getDb()
      .prepare(
        `SELECT id, actor_id AS actorId, action, entity_type AS entityType,
                entity_id AS entityId, meta_json AS metaJson, created_at AS createdAt
         FROM audit_log ORDER BY created_at DESC LIMIT ?`,
      )
      .all(limit) as {
      id: string;
      actorId: string | null;
      action: string;
      entityType: string;
      entityId: string | null;
      metaJson: string;
      createdAt: string;
    }[]
  ).map((r) => ({
    ...r,
    meta: (() => {
      try {
        return JSON.parse(r.metaJson) as Record<string, unknown>;
      } catch {
        return {};
      }
    })(),
  }));
}
