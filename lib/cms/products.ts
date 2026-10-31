import { getDb, newId, nowIso, withTransaction } from "@/lib/db";
import { writeAudit } from "@/lib/cms/audit";
import type { ProductRecord } from "@/lib/cms/types";
import type { Product } from "@/content/products-client";

type ProductRow = {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  status: string;
  available: number;
  featured: number;
  primary_category_slug: string | null;
  payload_json: string;
  stock_version: number;
  created_at: string;
  updated_at: string;
};

function rowToRecord(row: ProductRow): ProductRecord {
  const payload = JSON.parse(row.payload_json) as Omit<
    ProductRecord,
    | "id"
    | "slug"
    | "sku"
    | "name"
    | "status"
    | "available"
    | "featured"
    | "primaryCategorySlug"
    | "stockVersion"
    | "createdAt"
    | "updatedAt"
  >;
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    status: row.status as ProductRecord["status"],
    available: Boolean(row.available),
    featured: Boolean(row.featured),
    primaryCategorySlug: row.primary_category_slug,
    categorySlugs: payload.categorySlugs || [],
    shortDescription: payload.shortDescription || "",
    description: payload.description || "",
    image: payload.image || "",
    imageAlt: payload.imageAlt || "",
    images: payload.images || [],
    pricing: payload.pricing,
    attributes: payload.attributes || [],
    stockStatus: payload.stockStatus || (row.available ? "instock" : "outofstock"),
    sourceUrl: payload.sourceUrl || "",
    seo: payload.seo || { title: row.name, description: "", ogImage: "" },
    relatedProductIds: payload.relatedProductIds || [],
    saleStartsAt: payload.saleStartsAt ?? null,
    saleEndsAt: payload.saleEndsAt ?? null,
    stockVersion: row.stock_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toStorefrontProduct(r: ProductRecord): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    categorySlug: r.primaryCategorySlug || r.categorySlugs[0] || "accessories",
    categorySlugs: r.categorySlugs,
    image: r.image,
    imageAlt: r.imageAlt,
    images: r.images,
    shortDescription: r.shortDescription,
    description: r.description || r.shortDescription,
    featured: r.featured,
    available: r.available,
    sku: r.sku,
    sourceUrl: r.sourceUrl,
    pricing: r.pricing,
    attributes: r.attributes,
    stockStatus: r.stockStatus,
    importedAt: r.createdAt,
  };
}

export function listCmsProducts(opts?: {
  includeArchived?: boolean;
  status?: string;
  q?: string;
}) {
  const db = getDb();
  let sql = `SELECT * FROM cms_products WHERE 1=1`;
  const params: (string | number)[] = [];
  if (!opts?.includeArchived) {
    sql += ` AND status != 'archived'`;
  }
  if (opts?.status) {
    sql += ` AND status = ?`;
    params.push(opts.status);
  }
  if (opts?.q?.trim()) {
    sql += ` AND (name LIKE ? OR slug LIKE ? OR IFNULL(sku,'') LIKE ?)`;
    const like = `%${opts.q.trim()}%`;
    params.push(like, like, like);
  }
  sql += ` ORDER BY updated_at DESC`;
  return (db.prepare(sql).all(...params) as ProductRow[]).map(rowToRecord);
}

export function getCmsProductById(id: string): ProductRecord | null {
  const row = getDb()
    .prepare(`SELECT * FROM cms_products WHERE id = ?`)
    .get(id) as ProductRow | undefined;
  return row ? rowToRecord(row) : null;
}

export function getCmsProductBySlug(
  slug: string,
  opts?: { includeDraft?: boolean },
): ProductRecord | null {
  const row = getDb()
    .prepare(`SELECT * FROM cms_products WHERE slug = ?`)
    .get(slug) as ProductRow | undefined;
  if (!row) return null;
  const rec = rowToRecord(row);
  if (!opts?.includeDraft && rec.status !== "published") return null;
  return rec;
}

export function listPublishedProducts(): ProductRecord[] {
  return (
    getDb()
      .prepare(`SELECT * FROM cms_products WHERE status = 'published' ORDER BY name ASC`)
      .all() as ProductRow[]
  ).map(rowToRecord);
}

function payloadFromRecord(r: Partial<ProductRecord> & Pick<ProductRecord, "name">) {
  return {
    categorySlugs: r.categorySlugs || [],
    shortDescription: r.shortDescription || "",
    description: r.description || "",
    image: r.image || "",
    imageAlt: r.imageAlt || "",
    images: r.images || [],
    pricing: r.pricing ?? null,
    attributes: r.attributes || [],
    stockStatus:
      r.stockStatus || (r.available === false ? "outofstock" : "instock"),
    sourceUrl: r.sourceUrl || "",
    seo: r.seo || { title: r.name, description: "", ogImage: "" },
    relatedProductIds: r.relatedProductIds || [],
    saleStartsAt: r.saleStartsAt ?? null,
    saleEndsAt: r.saleEndsAt ?? null,
  };
}

export function assertUniqueProduct(slug: string, sku: string | null, excludeId?: string) {
  const db = getDb();
  const slugRow = db
    .prepare(`SELECT id FROM cms_products WHERE slug = ?`)
    .get(slug) as { id: string } | undefined;
  if (slugRow && slugRow.id !== excludeId) {
    throw Object.assign(new Error("Slug already in use."), { status: 400 });
  }
  if (sku) {
    const skuRow = db
      .prepare(`SELECT id FROM cms_products WHERE sku = ? AND sku IS NOT NULL`)
      .get(sku) as { id: string } | undefined;
    if (skuRow && skuRow.id !== excludeId) {
      throw Object.assign(new Error("SKU already in use."), { status: 400 });
    }
  }
}

export function createCmsProduct(
  input: Partial<ProductRecord> & { name: string; slug: string },
  actorId: string,
) {
  assertUniqueProduct(input.slug, input.sku ?? null);
  const id = input.id || newId("prod");
  const at = nowIso();
  const record: ProductRecord = {
    id,
    slug: input.slug,
    sku: input.sku ?? null,
    name: input.name,
    status: input.status || "draft",
    available: input.available ?? true,
    featured: input.featured ?? false,
    primaryCategorySlug: input.primaryCategorySlug ?? null,
    ...payloadFromRecord(input),
    categorySlugs: input.categorySlugs || [],
    shortDescription: input.shortDescription || "",
    description: input.description || "",
    image: input.image || "",
    imageAlt: input.imageAlt || "",
    images: input.images || [],
    pricing: input.pricing ?? null,
    attributes: input.attributes || [],
    stockStatus: input.stockStatus || "instock",
    sourceUrl: input.sourceUrl || "",
    seo: input.seo || { title: input.name, description: "", ogImage: "" },
    relatedProductIds: input.relatedProductIds || [],
    saleStartsAt: input.saleStartsAt ?? null,
    saleEndsAt: input.saleEndsAt ?? null,
    stockVersion: 1,
    createdAt: at,
    updatedAt: at,
  };
  getDb()
    .prepare(
      `INSERT INTO cms_products
       (id, slug, sku, name, status, available, featured, primary_category_slug,
        payload_json, stock_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    )
    .run(
      record.id,
      record.slug,
      record.sku,
      record.name,
      record.status,
      record.available ? 1 : 0,
      record.featured ? 1 : 0,
      record.primaryCategorySlug,
      JSON.stringify(payloadFromRecord(record)),
      at,
      at,
    );
  writeAudit({
    actorId,
    action: "product.create",
    entityType: "product",
    entityId: id,
  });
  return getCmsProductById(id)!;
}

export function updateCmsProduct(
  id: string,
  patch: Partial<ProductRecord>,
  actorId: string,
  opts?: { expectedStockVersion?: number },
) {
  const existing = getCmsProductById(id);
  if (!existing) throw Object.assign(new Error("Product not found."), { status: 404 });

  if (
    opts?.expectedStockVersion != null &&
    opts.expectedStockVersion !== existing.stockVersion
  ) {
    throw Object.assign(
      new Error(
        "Stock was updated elsewhere (order/inventory). Reload before saving availability.",
      ),
      { status: 409 },
    );
  }

  const nextSlug = patch.slug ?? existing.slug;
  const nextSku = patch.sku !== undefined ? patch.sku : existing.sku;
  assertUniqueProduct(nextSlug, nextSku, id);

  const availabilityChanging =
    patch.available !== undefined && patch.available !== existing.available;
  const next: ProductRecord = {
    ...existing,
    ...patch,
    slug: nextSlug,
    sku: nextSku,
    stockVersion: availabilityChanging
      ? existing.stockVersion + 1
      : existing.stockVersion,
    updatedAt: nowIso(),
  };

  getDb()
    .prepare(
      `UPDATE cms_products SET
         slug = ?, sku = ?, name = ?, status = ?, available = ?, featured = ?,
         primary_category_slug = ?, payload_json = ?, stock_version = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      next.slug,
      next.sku,
      next.name,
      next.status,
      next.available ? 1 : 0,
      next.featured ? 1 : 0,
      next.primaryCategorySlug,
      JSON.stringify(payloadFromRecord(next)),
      next.stockVersion,
      next.updatedAt,
      id,
    );
  writeAudit({
    actorId,
    action: "product.update",
    entityType: "product",
    entityId: id,
  });
  return getCmsProductById(id)!;
}

export function archiveCmsProduct(id: string, actorId: string) {
  return updateCmsProduct(id, { status: "archived" }, actorId);
}

/** Inventory bump used by order flows — increments stock_version. */
export function bumpProductStockVersion(productId: string) {
  withTransaction(() => {
    getDb()
      .prepare(
        `UPDATE cms_products SET stock_version = stock_version + 1, updated_at = ? WHERE id = ?`,
      )
      .run(nowIso(), productId);
  });
}
