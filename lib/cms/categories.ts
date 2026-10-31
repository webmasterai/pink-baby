import { getDb, newId, nowIso } from "@/lib/db";
import { writeAudit } from "@/lib/cms/audit";
import type { CategoryRecord } from "@/lib/cms/types";

type CatRow = {
  id: string;
  source_id: number | null;
  slug: string;
  name: string;
  display_name: string;
  parent_slug: string | null;
  description: string;
  image: string;
  nav_order: number;
  visible: number;
  payload_json: string;
  created_at: string;
  updated_at: string;
};

function rowToRecord(row: CatRow): CategoryRecord {
  let payload: {
    seo?: CategoryRecord["seo"];
    filterAttrOrder?: string[];
  } = {};
  try {
    payload = JSON.parse(row.payload_json || "{}");
  } catch {
    payload = {};
  }
  return {
    id: row.id,
    sourceId: row.source_id,
    slug: row.slug,
    name: row.name,
    displayName: row.display_name,
    parentSlug: row.parent_slug,
    description: row.description || "",
    image: row.image || "",
    navOrder: row.nav_order,
    visible: Boolean(row.visible),
    href: `/category/${row.slug}`,
    filterAttrOrder: payload.filterAttrOrder || [],
    seo: payload.seo || {
      title: row.display_name,
      description: "",
      ogImage: row.image || "",
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listCmsCategories() {
  return (
    getDb()
      .prepare(`SELECT * FROM cms_categories ORDER BY nav_order ASC, display_name ASC`)
      .all() as CatRow[]
  ).map(rowToRecord);
}

export function getCmsCategoryBySlug(slug: string): CategoryRecord | null {
  const row = getDb()
    .prepare(`SELECT * FROM cms_categories WHERE slug = ?`)
    .get(slug) as CatRow | undefined;
  return row ? rowToRecord(row) : null;
}

function wouldCreateCycle(slug: string, parentSlug: string | null): boolean {
  if (!parentSlug) return false;
  if (parentSlug === slug) return true;
  let current: string | null = parentSlug;
  const seen = new Set<string>();
  while (current) {
    if (current === slug) return true;
    if (seen.has(current)) return true;
    seen.add(current);
    const row = getCmsCategoryBySlug(current);
    current = row?.parentSlug ?? null;
  }
  return false;
}

export function saveCmsCategory(
  input: Partial<CategoryRecord> & { slug: string; name: string; displayName: string },
  actorId: string,
) {
  if (wouldCreateCycle(input.slug, input.parentSlug ?? null)) {
    throw Object.assign(new Error("Invalid category hierarchy (cycle)."), {
      status: 400,
    });
  }
  const existing = getCmsCategoryBySlug(input.slug);
  const at = nowIso();
  const payload = JSON.stringify({
    seo: input.seo ||
      existing?.seo || { title: input.displayName, description: "", ogImage: "" },
    filterAttrOrder: input.filterAttrOrder || existing?.filterAttrOrder || [],
  });

  if (existing && input.id && input.id !== existing.id) {
    throw Object.assign(new Error("Slug already exists."), { status: 400 });
  }

  if (existing || input.id) {
    const id = input.id || existing!.id;
    getDb()
      .prepare(
        `UPDATE cms_categories SET
           name = ?, display_name = ?, parent_slug = ?, description = ?, image = ?,
           nav_order = ?, visible = ?, payload_json = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        input.name,
        input.displayName,
        input.parentSlug ?? null,
        input.description ?? "",
        input.image ?? "",
        input.navOrder ?? existing?.navOrder ?? 0,
        (input.visible ?? existing?.visible ?? true) ? 1 : 0,
        payload,
        at,
        id,
      );
    writeAudit({
      actorId,
      action: "category.update",
      entityType: "category",
      entityId: id,
    });
    return getCmsCategoryBySlug(input.slug)!;
  }

  const id = newId("cat");
  getDb()
    .prepare(
      `INSERT INTO cms_categories
       (id, source_id, slug, name, display_name, parent_slug, description, image,
        nav_order, visible, payload_json, created_at, updated_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.slug,
      input.name,
      input.displayName,
      input.parentSlug ?? null,
      input.description ?? "",
      input.image ?? "",
      input.navOrder ?? 0,
      input.visible === false ? 0 : 1,
      payload,
      at,
      at,
    );
  writeAudit({
    actorId,
    action: "category.create",
    entityType: "category",
    entityId: id,
  });
  return getCmsCategoryBySlug(input.slug)!;
}

export function productCountForCategory(slug: string): number {
  const rows = getDb()
    .prepare(
      `SELECT payload_json AS payloadJson, primary_category_slug AS primarySlug
       FROM cms_products WHERE status = 'published'`,
    )
    .all() as { payloadJson: string; primarySlug: string | null }[];
  let n = 0;
  for (const r of rows) {
    if (r.primarySlug === slug) {
      n += 1;
      continue;
    }
    try {
      const p = JSON.parse(r.payloadJson) as { categorySlugs?: string[] };
      if (p.categorySlugs?.includes(slug)) n += 1;
    } catch {
      // ignore
    }
  }
  return n;
}
