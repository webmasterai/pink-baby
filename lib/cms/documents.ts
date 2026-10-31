import { getDb, newId, nowIso } from "@/lib/db";
import { writeAudit } from "@/lib/cms/audit";
import type { CmsDocumentKey } from "@/lib/cms/types";

export type CmsDocumentRow = {
  docKey: string;
  title: string;
  published: unknown | null;
  draft: unknown | null;
  conflictToken: string;
  publishedRevision: number;
  draftRevision: number;
  updatedBy: string | null;
  updatedAt: string;
  publishedAt: string | null;
  publishedBy: string | null;
};

function parseJson(raw: string | null): unknown | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getDocument(docKey: string): CmsDocumentRow | null {
  const row = getDb()
    .prepare(
      `SELECT doc_key AS docKey, title, published_json AS publishedJson,
              draft_json AS draftJson, conflict_token AS conflictToken,
              published_revision AS publishedRevision, draft_revision AS draftRevision,
              updated_by AS updatedBy, updated_at AS updatedAt,
              published_at AS publishedAt, published_by AS publishedBy
       FROM cms_documents WHERE doc_key = ?`,
    )
    .get(docKey) as
    | {
        docKey: string;
        title: string;
        publishedJson: string | null;
        draftJson: string | null;
        conflictToken: string;
        publishedRevision: number;
        draftRevision: number;
        updatedBy: string | null;
        updatedAt: string;
        publishedAt: string | null;
        publishedBy: string | null;
      }
    | undefined;
  if (!row) return null;
  return {
    docKey: row.docKey,
    title: row.title,
    published: parseJson(row.publishedJson),
    draft: parseJson(row.draftJson),
    conflictToken: row.conflictToken,
    publishedRevision: row.publishedRevision,
    draftRevision: row.draftRevision,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    publishedBy: row.publishedBy,
  };
}

/** Public storefront: published payload only. */
export function getPublishedPayload<T>(docKey: CmsDocumentKey | string): T | null {
  const doc = getDocument(docKey);
  return (doc?.published as T) ?? null;
}

/** Admin/preview: draft if present, else published. */
export function getEditablePayload<T>(docKey: string): T | null {
  const doc = getDocument(docKey);
  if (!doc) return null;
  return ((doc.draft ?? doc.published) as T) ?? null;
}

export class CmsConflictError extends Error {
  status = 409;
  constructor(message = "This content was updated elsewhere. Reload and try again.") {
    super(message);
  }
}

export function saveDraft(input: {
  docKey: string;
  title?: string;
  payload: unknown;
  actorId: string;
  conflictToken: string;
}) {
  const db = getDb();
  const existing = getDocument(input.docKey);
  if (!existing) {
    throw new Error(`Unknown CMS document: ${input.docKey}`);
  }
  if (existing.conflictToken !== input.conflictToken) {
    throw new CmsConflictError();
  }
  const nextToken = newId("tok");
  const nextRev = existing.draftRevision + 1;
  const at = nowIso();
  db.prepare(
    `UPDATE cms_documents
     SET draft_json = ?, draft_revision = ?, conflict_token = ?,
         updated_by = ?, updated_at = ?, title = COALESCE(?, title)
     WHERE doc_key = ?`,
  ).run(
    JSON.stringify(input.payload),
    nextRev,
    nextToken,
    input.actorId,
    at,
    input.title ?? null,
    input.docKey,
  );
  db.prepare(
    `INSERT INTO cms_revisions (id, doc_key, revision, payload_json, created_by, created_at, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    newId("rev"),
    input.docKey,
    nextRev,
    JSON.stringify(input.payload),
    input.actorId,
    at,
    "draft",
  );
  writeAudit({
    actorId: input.actorId,
    action: "cms.draft_save",
    entityType: "cms_document",
    entityId: input.docKey,
    meta: { revision: nextRev },
  });
  return getDocument(input.docKey)!;
}

export function publishDocument(input: {
  docKey: string;
  actorId: string;
  conflictToken: string;
}) {
  const existing = getDocument(input.docKey);
  if (!existing) throw new Error(`Unknown CMS document: ${input.docKey}`);
  if (existing.conflictToken !== input.conflictToken) {
    throw new CmsConflictError();
  }
  const payload = existing.draft ?? existing.published;
  if (payload == null) throw new Error("Nothing to publish.");
  const nextToken = newId("tok");
  const nextPub = existing.publishedRevision + 1;
  const at = nowIso();
  getDb()
    .prepare(
      `UPDATE cms_documents
       SET published_json = ?, draft_json = NULL, published_revision = ?,
           draft_revision = draft_revision, conflict_token = ?,
           updated_by = ?, updated_at = ?, published_at = ?, published_by = ?
       WHERE doc_key = ?`,
    )
    .run(
      JSON.stringify(payload),
      nextPub,
      nextToken,
      input.actorId,
      at,
      at,
      input.actorId,
      input.docKey,
    );
  getDb()
    .prepare(
      `INSERT INTO cms_revisions (id, doc_key, revision, payload_json, created_by, created_at, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      newId("rev"),
      input.docKey,
      nextPub,
      JSON.stringify(payload),
      input.actorId,
      at,
      "publish",
    );
  writeAudit({
    actorId: input.actorId,
    action: "cms.publish",
    entityType: "cms_document",
    entityId: input.docKey,
    meta: { revision: nextPub },
  });
  try {
    // Sync require: publish must revalidate before the response returns.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Next cache outside request edge
    const { revalidatePath } = require("next/cache") as typeof import("next/cache");
    revalidatePath("/", "layout");
    if (input.docKey.startsWith("page:")) {
      revalidatePath(`/${input.docKey.slice(5)}`);
    }
    if (input.docKey === "home") revalidatePath("/");
  } catch {
    // cache API unavailable in some contexts
  }
  return getDocument(input.docKey)!;
}

export function restoreRevision(input: {
  docKey: string;
  revisionId: string;
  actorId: string;
  conflictToken: string;
}) {
  const existing = getDocument(input.docKey);
  if (!existing) throw new Error(`Unknown CMS document: ${input.docKey}`);
  if (existing.conflictToken !== input.conflictToken) {
    throw new CmsConflictError();
  }
  const rev = getDb()
    .prepare(
      `SELECT payload_json AS payloadJson FROM cms_revisions WHERE id = ? AND doc_key = ?`,
    )
    .get(input.revisionId, input.docKey) as { payloadJson: string } | undefined;
  if (!rev) throw new Error("Revision not found.");
  return saveDraft({
    docKey: input.docKey,
    payload: JSON.parse(rev.payloadJson),
    actorId: input.actorId,
    conflictToken: input.conflictToken,
  });
}

export function listRevisions(docKey: string, limit = 30) {
  return getDb()
    .prepare(
      `SELECT id, revision, created_by AS createdBy, created_at AS createdAt, note
       FROM cms_revisions WHERE doc_key = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(docKey, limit) as {
    id: string;
    revision: number;
    createdBy: string | null;
    createdAt: string;
    note: string | null;
  }[];
}

export function ensureDocument(
  docKey: string,
  title: string,
  published: unknown,
) {
  const existing = getDocument(docKey);
  if (existing) return existing;
  const at = nowIso();
  getDb()
    .prepare(
      `INSERT INTO cms_documents
       (doc_key, title, published_json, draft_json, conflict_token,
        published_revision, draft_revision, updated_by, updated_at, published_at, published_by)
       VALUES (?, ?, ?, NULL, ?, 1, 0, NULL, ?, ?, NULL)`,
    )
    .run(docKey, title, JSON.stringify(published), newId("tok"), at, at);
  return getDocument(docKey)!;
}
