/**
 * Pink Baby catalog importer from the public WooCommerce Store API.
 *
 * Usage:
 *   node scripts/import-catalog.mjs --dry-run
 *   node scripts/import-catalog.mjs --confirm-overwrite
 *
 * Safety:
 * - Dry-run never writes content/*.ts modules or downloads product images.
 * - Apply refuses to overwrite an existing content/catalog.ts unless
 *   --confirm-overwrite is passed (protects the completed catalog / CMS edits).
 * - Apply backs up content modules under data/import/backups/ before writing.
 * - Image downloads skip files that already exist (stable paths by product id).
 * - Does not touch SQLite / CMS published products (seed only fills empty DB).
 *
 * Do NOT re-run apply against production after editorial catalog work unless
 * you intentionally want regenerated TypeScript modules.
 */
import { mkdirSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = "https://pinkbaby.pk";
const API = `${SOURCE}/wp-json/wc/store/v1`;
const DRY = process.argv.includes("--dry-run");
const CONFIRM_OVERWRITE = process.argv.includes("--confirm-overwrite");
const IMPORT_DIR = path.join(ROOT, "data", "import");
const MEDIA_DIR = path.join(ROOT, "public", "images", "products");
const CATALOG_MODULE = path.join(ROOT, "content", "catalog.ts");
const BACKUP_DIR = path.join(IMPORT_DIR, "backups", new Date().toISOString().replace(/[:.]/g, "-"));

const CATEGORY_SLUGS = [
  "accessories",
  "feeding-bottles",
  "pp-standard-neck-bottle",
  "pp-wide-neck-bottle",
  "ppsu-wide-neck-bottle",
  "pp-ultra-wideneck-bottle",
  "glass-bottles",
  "breast-care",
  "pacifiers",
  "teats",
  "sale",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "PinkBabyCatalogImporter/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const total = res.headers.get("x-wp-total");
  const totalPages = res.headers.get("x-wp-totalpages");
  const body = await res.json();
  return { body, total: Number(total || 0), totalPages: Number(totalPages || 1) };
}

async function fetchAllCategoryProducts(slug) {
  const products = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = `${API}/products?category=${encodeURIComponent(slug)}&per_page=100&page=${page}`;
    const { body, totalPages: tp } = await fetchJson(url);
    totalPages = tp || 1;
    products.push(...body);
    page += 1;
    await sleep(250);
  } while (page <= totalPages);
  return products;
}

function moneyFromStorePrice(prices, onSaleFlag) {
  if (!prices) return null;
  const minor = Number(prices.currency_minor_unit ?? 0);
  const toMajor = (raw) => {
    if (raw === undefined || raw === null || raw === "") return null;
    const n = Number(raw);
    if (Number.isNaN(n)) return null;
    return minor > 0 ? n / 10 ** minor : n;
  };
  const price = toMajor(prices.price);
  const regular = toMajor(prices.regular_price);
  const sale = toMajor(prices.sale_price);
  const onSale =
    Boolean(onSaleFlag) ||
    (regular !== null && sale !== null && sale < regular);
  return {
    currency: prices.currency_code || "PKR",
    price,
    regularPrice: regular,
    salePrice: onSale ? sale : null,
    onSale,
  };
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyFilename(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function downloadImage(url, destPath) {
  if (existsSync(destPath)) return { skipped: true, path: destPath };
  if (DRY) return { skipped: true, dryRun: true, path: destPath };
  const res = await fetch(url, {
    headers: { "User-Agent": "PinkBabyCatalogImporter/1.0" },
  });
  if (!res.ok) throw new Error(`Image HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  return { skipped: false, path: destPath, bytes: buf.length };
}

function mapCategoryTaxonomy(apiCategories) {
  const byId = new Map(apiCategories.map((c) => [c.id, c]));
  return apiCategories
    .map((c) => ({
      id: c.id,
      sourceId: c.id,
      name: c.name.replace(/\b\w/g, (m) => m.toUpperCase()).replace(/\bCare\b/i, "Care"),
      displayName: titleCaseCategory(c.name),
      slug: c.slug,
      parentId: c.parent || null,
      parentSlug: c.parent ? byId.get(c.parent)?.slug || null : null,
      count: c.count ?? 0,
      href:
        c.parent && byId.get(c.parent)
          ? `/category/${byId.get(c.parent).slug}/${c.slug}`
          : `/category/${c.slug}`,
      sourceUrl: c.link || `${SOURCE}/product-category/${c.slug}/`,
      image: lifestyleImageFor(c.slug),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function titleCaseCategory(name) {
  const upper = name.trim();
  if (upper.toLowerCase() === "sale") return "Sale";
  return upper
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace("Ppsu", "PPSU")
    .replace("Pp ", "PP ")
    .replace("Wideneck", "Wideneck");
}

function lifestyleImageFor(slug) {
  const map = {
    accessories: "/images/accessories.png",
    "feeding-bottles": "/images/feeding.png",
    "breast-care": "/images/breast.png",
    pacifiers: "/images/pacifiers.png",
    teats: "/images/teats.png",
    "pp-standard-neck-bottle": "/images/feeding.png",
    "pp-wide-neck-bottle": "/images/feeding.png",
    "ppsu-wide-neck-bottle": "/images/feeding.png",
    "pp-ultra-wideneck-bottle": "/images/feeding.png",
    "glass-bottles": "/images/feeding.png",
    sale: "/images/feeding.png",
  };
  return map[slug] || "/images/feeding.png";
}

function extFromUrl(url) {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname);
    const ext = path.extname(base).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) return ext;
  } catch {
    /* ignore */
  }
  return ".jpg";
}

async function main() {
  mkdirSync(IMPORT_DIR, { recursive: true });
  if (!DRY) mkdirSync(MEDIA_DIR, { recursive: true });

  if (!DRY && existsSync(CATALOG_MODULE) && !CONFIRM_OVERWRITE) {
    console.error(
      [
        "Refusing to overwrite existing content/catalog.ts.",
        "The storefront catalog is already generated; re-import would replace modules",
        "and risk diverging from CMS product edits.",
        "",
        "Use --dry-run to preview against the live API without writing modules.",
        "Use --confirm-overwrite only if you intentionally want a full regenerate.",
        "Rollback: restore files from data/import/backups/<timestamp>/",
      ].join("\n"),
    );
    process.exit(2);
  }

  if (!DRY) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    for (const file of ["catalog.ts", "products.ts", "categories.ts", "site.ts"]) {
      const src = path.join(ROOT, "content", file);
      if (existsSync(src)) copyFileSync(src, path.join(BACKUP_DIR, file));
    }
    console.log("Backup written to", BACKUP_DIR);
  }

  console.log(DRY ? "DRY RUN" : "IMPORT", "from", SOURCE);

  const { body: apiCategories } = await fetchJson(
    `${API}/products/categories?per_page=100`,
  );
  writeFileSync(
    path.join(IMPORT_DIR, "categories-live.json"),
    JSON.stringify(apiCategories, null, 2),
  );

  const byId = new Map();
  const discoveredByCategory = {};
  const missingFields = [];
  const imageErrors = [];

  for (const slug of CATEGORY_SLUGS) {
    const list = await fetchAllCategoryProducts(slug);
    discoveredByCategory[slug] = list.map((p) => p.id);
    for (const p of list) {
      const existing = byId.get(p.id);
      if (!existing) {
        byId.set(p.id, { ...p, _categorySlugs: new Set([slug]) });
      } else {
        existing._categorySlugs.add(slug);
        // Prefer richer category arrays / images when present
        if ((!existing.categories || existing.categories.length === 0) && p.categories?.length) {
          existing.categories = p.categories;
        }
        if ((!existing.images || existing.images.length === 0) && p.images?.length) {
          existing.images = p.images;
        }
      }
    }
    console.log(`category ${slug}: ${list.length}`);
  }

  const categories = mapCategoryTaxonomy(apiCategories);
  const products = [];
  let imageDownloads = 0;

  for (const raw of byId.values()) {
    const pricing = moneyFromStorePrice(raw.prices, raw.on_sale);
    const categorySlugs = [
      ...raw._categorySlugs,
      ...(raw.categories || []).map((c) => c.slug),
    ];
    const uniqueCats = [...new Set(categorySlugs)];

    const localImages = [];
    for (let i = 0; i < (raw.images || []).length; i++) {
      const img = raw.images[i];
      const srcUrl = img.src || img.thumbnail || img.srcset;
      if (!srcUrl) continue;
      const ext = extFromUrl(srcUrl);
      const file = `${raw.id}-${slugifyFilename(raw.slug || raw.name)}-${i}${ext}`;
      const dest = path.join(MEDIA_DIR, file);
      try {
        const result = await downloadImage(srcUrl, dest);
        if (!result.dryRun && !result.skipped) imageDownloads += 1;
        localImages.push({
          src: `/images/products/${file}`,
          alt: stripHtml(img.alt || raw.name),
          sourceUrl: srcUrl,
        });
        await sleep(80);
      } catch (err) {
        imageErrors.push({ productId: raw.id, url: srcUrl, error: String(err) });
      }
    }

    if (!raw.name) missingFields.push({ id: raw.id, field: "name" });
    if (!pricing?.price && pricing?.price !== 0) {
      missingFields.push({ id: raw.id, field: "price" });
    }

    products.push({
      id: `wc-${raw.id}`,
      sourceId: raw.id,
      sourceUrl: raw.permalink || `${SOURCE}/product/${raw.slug}/`,
      slug: raw.slug,
      sku: raw.sku || null,
      name: raw.name,
      shortDescription: stripHtml(raw.short_description || ""),
      description: stripHtml(raw.description || ""),
      categorySlugs: uniqueCats,
      primaryCategorySlug: uniqueCats.find((s) => s !== "sale") || uniqueCats[0] || null,
      pricing,
      available: Boolean(raw.is_in_stock),
      stockStatus: raw.is_in_stock ? "instock" : "outofstock",
      type: raw.type || "simple",
      images: localImages,
      image: localImages[0]?.src || lifestyleImageFor(uniqueCats[0] || "feeding-bottles"),
      imageAlt: localImages[0]?.alt || raw.name,
      attributes: (raw.attributes || []).map((a) => ({
        name: a.name,
        taxonomy: a.taxonomy,
        hasVariations: Boolean(a.has_variations),
        terms: (a.terms || []).map((t) => t.name),
      })),
      variations: raw.variations || [],
      featured: false,
      importedAt: new Date().toISOString(),
    });
  }

  // Mark featured: prefer in-stock items across top categories
  const featuredPick = [];
  for (const slug of ["feeding-bottles", "breast-care", "pacifiers", "teats"]) {
    const hit = products.find(
      (p) => p.available && p.categorySlugs.includes(slug) && !featuredPick.includes(p.id),
    );
    if (hit) featuredPick.push(hit.id);
  }
  while (featuredPick.length < 4) {
    const next = products.find((p) => p.available && !featuredPick.includes(p.id));
    if (!next) break;
    featuredPick.push(next.id);
  }
  for (const p of products) p.featured = featuredPick.includes(p.id);

  products.sort((a, b) => a.name.localeCompare(b.name));

  const report = {
    importedAt: new Date().toISOString(),
    source: SOURCE,
    dryRun: DRY,
    totals: {
      discoveredUnique: byId.size,
      imported: products.length,
      imagesDownloaded: imageDownloads,
      inStock: products.filter((p) => p.available).length,
      outOfStock: products.filter((p) => !p.available).length,
    },
    discoveredByCategory,
    importedPerCategory: Object.fromEntries(
      CATEGORY_SLUGS.map((slug) => [
        slug,
        products.filter((p) => p.categorySlugs.includes(slug)).length,
      ]),
    ),
    missingFields,
    imageErrors,
    urlMapping: products.map((p) => ({
      sourceUrl: p.sourceUrl,
      localPath: `/product/${p.slug}`,
      sourceId: p.sourceId,
    })),
  };

  writeFileSync(path.join(IMPORT_DIR, "import-report.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    path.join(IMPORT_DIR, "products.normalized.json"),
    JSON.stringify(products, null, 2),
  );
  writeFileSync(
    path.join(IMPORT_DIR, "categories.normalized.json"),
    JSON.stringify(categories, null, 2),
  );

  if (!DRY) {
    writeCatalogModules(categories, products, report);
  }

  console.log(JSON.stringify(report.totals, null, 2));
  console.log("per category", report.importedPerCategory);
  console.log("image errors", imageErrors.length, "missing fields", missingFields.length);
  console.log("report:", path.join(IMPORT_DIR, "import-report.json"));
}

function writeCatalogModules(categories, products, report) {
  const catalogPath = path.join(ROOT, "content", "catalog.ts");
  const ts = `/* Auto-generated by scripts/import-catalog.mjs — do not edit by hand.
 * Source: ${SOURCE}
 * Imported: ${report.importedAt}
 */
export type Money = {
  currency: string;
  price: number | null;
  regularPrice: number | null;
  salePrice: number | null;
  onSale: boolean;
};

export type CatalogImage = {
  src: string;
  alt: string;
  sourceUrl?: string;
};

export type CatalogCategory = {
  id: number;
  sourceId: number;
  name: string;
  displayName: string;
  slug: string;
  parentId: number | null;
  parentSlug: string | null;
  count: number;
  href: string;
  sourceUrl: string;
  image: string;
};

export type CatalogProduct = {
  id: string;
  sourceId: number;
  sourceUrl: string;
  slug: string;
  sku: string | null;
  name: string;
  shortDescription: string;
  description: string;
  categorySlugs: string[];
  primaryCategorySlug: string | null;
  pricing: Money | null;
  available: boolean;
  stockStatus: string;
  type: string;
  images: CatalogImage[];
  image: string;
  imageAlt: string;
  attributes: { name: string; taxonomy: string; hasVariations: boolean; terms: string[] }[];
  variations: number[];
  featured: boolean;
  importedAt: string;
};

export const catalogImportedAt = ${JSON.stringify(report.importedAt)};
export const catalogSource = ${JSON.stringify(SOURCE)};

export const catalogCategories: CatalogCategory[] = ${JSON.stringify(categories, null, 2)};

export const catalogProducts: CatalogProduct[] = ${JSON.stringify(products, null, 2)};

export function getAllCatalogProducts() {
  return catalogProducts;
}

export function getFeaturedCatalogProducts() {
  return catalogProducts.filter((p) => p.featured);
}

export function getCatalogProductBySlug(slug: string) {
  return catalogProducts.find((p) => p.slug === slug);
}

export function getCatalogProductById(id: string) {
  return catalogProducts.find((p) => p.id === id);
}

export function getCatalogProductsByCategory(slug: string) {
  return catalogProducts.filter((p) => p.categorySlugs.includes(slug));
}

export function searchCatalogProducts(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return catalogProducts.filter((p) => {
    const hay = [p.name, p.shortDescription, p.description, p.sku, ...p.categorySlugs]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function getRootCategories() {
  return catalogCategories.filter((c) => !c.parentId);
}

export function getChildCategories(parentSlug: string) {
  return catalogCategories.filter((c) => c.parentSlug === parentSlug);
}

export function getCategoryBySlug(slug: string) {
  return catalogCategories.find((c) => c.slug === slug);
}

export function formatPkr(amount: number | null | undefined) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return null;
  return \`Rs \${Math.round(amount).toLocaleString("en-PK")}\`;
}
`;

  writeFileSync(catalogPath, ts);

  // Compatibility shims
  writeFileSync(
    path.join(ROOT, "content", "categories.ts"),
    `import {
  catalogCategories,
  getCategoryBySlug as getCat,
  getChildCategories,
  getRootCategories,
  type CatalogCategory,
} from "@/content/catalog";

export type Category = {
  slug: string;
  name: string;
  href: string;
  image: string;
  imageAlt: string;
  description: string;
  parentSlug?: string | null;
  children?: Category[];
};

function toCategory(c: CatalogCategory): Category {
  return {
    slug: c.slug,
    name: c.displayName,
    href: c.href,
    image: c.image,
    imageAlt: \`\${c.displayName} products\`,
    description: \`Browse \${c.displayName} from Pink Baby.\`,
    parentSlug: c.parentSlug,
  };
}

export const categories: Category[] = getRootCategories()
  .filter((c) => c.slug !== "sale")
  .map((c) => ({
    ...toCategory(c),
    children: getChildCategories(c.slug).map(toCategory),
  }));

export const navLinks = [
  ...categories.map((c) => ({ name: c.name, href: c.href })),
  { name: "Sale", href: "/sale" },
] as const;

export function getCategoryBySlug(slug: string): Category | undefined {
  const found = getCat(slug);
  return found ? toCategory(found) : undefined;
}

export function getAllCategoriesFlat(): Category[] {
  return catalogCategories.map(toCategory);
}

export { getChildCategories, getRootCategories };
`,
  );

  writeFileSync(
    path.join(ROOT, "content", "products.ts"),
    `import {
  catalogProducts,
  getCatalogProductById,
  getCatalogProductBySlug,
  getCatalogProductsByCategory,
  getFeaturedCatalogProducts,
  searchCatalogProducts,
  type CatalogProduct,
} from "@/content/catalog";

export type Product = {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  categorySlugs: string[];
  image: string;
  imageAlt: string;
  images: { src: string; alt: string }[];
  shortDescription: string;
  description: string;
  featured: boolean;
  available: boolean;
  sku: string | null;
  sourceUrl: string;
  pricing: CatalogProduct["pricing"];
};

function toProduct(p: CatalogProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    categorySlug: p.primaryCategorySlug || p.categorySlugs[0] || "accessories",
    categorySlugs: p.categorySlugs,
    image: p.image,
    imageAlt: p.imageAlt,
    images: p.images.map((i) => ({ src: i.src, alt: i.alt })),
    shortDescription: p.shortDescription,
    description: p.description || p.shortDescription,
    featured: p.featured,
    available: p.available,
    sku: p.sku,
    sourceUrl: p.sourceUrl,
    pricing: p.pricing,
  };
}

export function getAllProducts(): Product[] {
  return catalogProducts.map(toProduct);
}

export function getFeaturedProducts(): Product[] {
  return getFeaturedCatalogProducts().map(toProduct);
}

export function getProductBySlug(slug: string): Product | undefined {
  const p = getCatalogProductBySlug(slug);
  return p ? toProduct(p) : undefined;
}

export function getProductById(id: string): Product | undefined {
  const p = getCatalogProductById(id);
  return p ? toProduct(p) : undefined;
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return getCatalogProductsByCategory(categorySlug).map(toProduct);
}

export function searchProducts(query: string): Product[] {
  return searchCatalogProducts(query).map(toProduct);
}

export const products: Product[] = getAllProducts();
`,
  );

  writeFileSync(
    path.join(ROOT, "content", "url-mapping.json"),
    JSON.stringify(report.urlMapping, null, 2),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
