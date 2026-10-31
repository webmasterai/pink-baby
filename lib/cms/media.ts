import fs from "node:fs";
import path from "node:path";
import { getDb, newId, nowIso } from "@/lib/db";
import { writeAudit } from "@/lib/cms/audit";
import { getUploadsDir } from "@/lib/paths";
import type { MediaAsset } from "@/lib/cms/types";

const UPLOAD_DIR = getUploadsDir();
const PUBLIC_UPLOAD = "/uploads";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

const MAX_BYTES = 5 * 1024 * 1024;

export function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export function listMedia(q?: string): MediaAsset[] {
  const db = getDb();
  const rows = (
    q?.trim()
      ? (db
          .prepare(
            `SELECT id, filename, path, mime, size, alt, created_at AS createdAt, created_by AS createdBy
             FROM media_assets
             WHERE filename LIKE ? OR alt LIKE ? OR path LIKE ?
             ORDER BY created_at DESC`,
          )
          .all(`%${q}%`, `%${q}%`, `%${q}%`) as MediaAsset[])
      : (db
          .prepare(
            `SELECT id, filename, path, mime, size, alt, created_at AS createdAt, created_by AS createdBy
             FROM media_assets ORDER BY created_at DESC`,
          )
          .all() as MediaAsset[])
  );
  return rows;
}

function safeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function saveUploadedMedia(input: {
  bytes: Buffer;
  filename: string;
  mime: string;
  alt?: string;
  actorId: string;
}): Promise<MediaAsset> {
  if (!ALLOWED.has(input.mime)) {
    throw Object.assign(new Error("File type not allowed."), { status: 400 });
  }
  if (input.bytes.length > MAX_BYTES) {
    throw Object.assign(new Error("File too large (max 5MB)."), { status: 400 });
  }
  // Basic SVG script rejection
  if (input.mime === "image/svg+xml") {
    const text = input.bytes.toString("utf8");
    if (/<script|on\w+=|javascript:/i.test(text)) {
      throw Object.assign(new Error("SVG rejected for safety."), { status: 400 });
    }
  }

  ensureUploadDir();
  const id = newId("med");
  const base = safeName(input.filename) || "upload";
  const ext = path.extname(base) || "";
  const stored = `${id}${ext}`;
  const abs = path.join(UPLOAD_DIR, stored);
  fs.writeFileSync(abs, input.bytes);
  const publicPath = `${PUBLIC_UPLOAD}/${stored}`;
  const at = nowIso();
  getDb()
    .prepare(
      `INSERT INTO media_assets (id, filename, path, mime, size, alt, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.filename,
      publicPath,
      input.mime,
      input.bytes.length,
      input.alt || "",
      at,
      input.actorId,
    );
  writeAudit({
    actorId: input.actorId,
    action: "media.upload",
    entityType: "media",
    entityId: id,
  });
  return {
    id,
    filename: input.filename,
    path: publicPath,
    mime: input.mime,
    size: input.bytes.length,
    alt: input.alt || "",
    createdAt: at,
    createdBy: input.actorId,
  };
}

export function updateMediaAlt(id: string, alt: string, actorId: string) {
  getDb().prepare(`UPDATE media_assets SET alt = ? WHERE id = ?`).run(alt, id);
  writeAudit({
    actorId,
    action: "media.update",
    entityType: "media",
    entityId: id,
  });
}

export function findMediaUsage(pathValue: string): string[] {
  const refs: string[] = [];
  const docs = getDb()
    .prepare(
      `SELECT doc_key AS docKey, published_json AS pub, draft_json AS draft FROM cms_documents`,
    )
    .all() as { docKey: string; pub: string | null; draft: string | null }[];
  for (const d of docs) {
    const blob = `${d.pub || ""}${d.draft || ""}`;
    if (blob.includes(pathValue)) refs.push(`document:${d.docKey}`);
  }
  const products = getDb()
    .prepare(`SELECT id, payload_json AS payload FROM cms_products`)
    .all() as { id: string; payload: string }[];
  for (const p of products) {
    if (p.payload.includes(pathValue)) refs.push(`product:${p.id}`);
  }
  return refs;
}

export function deleteMedia(id: string, actorId: string, force = false) {
  const row = getDb()
    .prepare(`SELECT path FROM media_assets WHERE id = ?`)
    .get(id) as { path: string } | undefined;
  if (!row) throw Object.assign(new Error("Media not found."), { status: 404 });
  const usage = findMediaUsage(row.path);
  if (usage.length && !force) {
    throw Object.assign(
      new Error(`Media still referenced by: ${usage.slice(0, 5).join(", ")}`),
      { status: 409, usage },
    );
  }
  const abs = path.join(UPLOAD_DIR, path.basename(row.path));
  try {
    fs.unlinkSync(abs);
  } catch {
    // file missing ok
  }
  getDb().prepare(`DELETE FROM media_assets WHERE id = ?`).run(id);
  writeAudit({
    actorId,
    action: "media.delete",
    entityType: "media",
    entityId: id,
    meta: { force, usageCount: usage.length },
  });
}

export function resolveUploadAbsolute(publicPath: string): string | null {
  if (!publicPath.startsWith(`${PUBLIC_UPLOAD}/`)) return null;
  const base = path.basename(publicPath);
  if (base.includes("..") || base.includes("/") || base.includes("\\")) return null;
  return path.join(UPLOAD_DIR, base);
}
