/**
 * Compare local catalog against public WooCommerce Store API.
 * Usage: node scripts/audit-catalog.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = "https://pinkbaby.pk";
const API = `${SOURCE}/wp-json/wc/store/v1`;
const IMPORT_DIR = path.join(ROOT, "data", "import");

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
    headers: { Accept: "application/json", "User-Agent": "PinkBabyCatalogAudit/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const totalPages = Number(res.headers.get("x-wp-totalpages") || 1);
  const total = Number(res.headers.get("x-wp-total") || 0);
  return { body: await res.json(), totalPages, total };
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
    await sleep(200);
  } while (page <= totalPages);
  return products;
}

function loadLocalIds() {
  const catalogPath = path.join(ROOT, "content", "catalog.ts");
  const text = readFileSync(catalogPath, "utf8");
  const ids = [...text.matchAll(/"sourceId":\s*(\d+)/g)].map((m) => Number(m[1]));
  const slugs = [...text.matchAll(/"slug":\s*"([^"]+)"/g)].map((m) => m[1]);
  // product slugs appear after products array — approximate via sourceId unique
  return { sourceIds: new Set(ids), slugCount: slugs.length };
}

function checkLocalImages(localProducts) {
  const missing = [];
  for (const p of localProducts) {
    const img = p.image || "";
    if (!img.startsWith("/images/")) continue;
    const file = path.join(ROOT, "public", img.replace(/^\//, ""));
    if (!existsSync(file)) missing.push({ id: p.id, image: img });
  }
  return missing;
}

async function main() {
  const byId = new Map();
  const byCategory = {};
  for (const slug of CATEGORY_SLUGS) {
    const list = await fetchAllCategoryProducts(slug);
    byCategory[slug] = list.map((p) => p.id);
    for (const p of list) byId.set(p.id, p);
    console.log(`remote ${slug}: ${list.length}`);
  }

  const remoteIds = [...byId.keys()];
  const localNormPath = path.join(IMPORT_DIR, "products.normalized.json");
  let localProducts = [];
  if (existsSync(localNormPath)) {
    localProducts = JSON.parse(readFileSync(localNormPath, "utf8"));
  }
  const localIds = new Set(localProducts.map((p) => p.sourceId));
  const missing = remoteIds.filter((id) => !localIds.has(id));
  const extra = [...localIds].filter((id) => !byId.has(id));

  const priceConflicts = [];
  const saleMembershipConflicts = [];
  for (const local of localProducts) {
    const remote = byId.get(local.sourceId);
    if (!remote) continue;
    const minor = Number(remote.prices?.currency_minor_unit ?? 0);
    const toMajor = (raw) => {
      if (raw === undefined || raw === null || raw === "") return null;
      const n = Number(raw);
      if (Number.isNaN(n)) return null;
      return minor > 0 ? n / 10 ** minor : n;
    };
    const remotePrice = toMajor(remote.prices?.price);
    const localPrice = local.pricing?.price ?? null;
    if (
      remotePrice != null &&
      localPrice != null &&
      Math.round(remotePrice) !== Math.round(localPrice)
    ) {
      priceConflicts.push({
        sourceId: local.sourceId,
        slug: local.slug,
        localPrice,
        remotePrice,
      });
    }
    const remoteOnSale = Boolean(remote.on_sale);
    const inSaleCat = (local.categorySlugs || []).includes("sale");
    if (inSaleCat && !remoteOnSale && !local.pricing?.onSale) {
      saleMembershipConflicts.push({
        sourceId: local.sourceId,
        slug: local.slug,
        note: "In local sale category but remote on_sale false and no salePrice",
      });
    }
  }

  const missingSku = localProducts.filter((p) => !p.sku).length;
  const missingDesc = localProducts.filter((p) => !p.description).length;
  const missingImages = checkLocalImages(localProducts);
  const dupSource = localProducts.length - new Set(localProducts.map((p) => p.sourceId)).size;

  const report = {
    auditedAt: new Date().toISOString(),
    source: SOURCE,
    remoteUniqueProducts: remoteIds.length,
    localProducts: localProducts.length,
    missingFromLocal: missing.length,
    missingIds: missing,
    extraLocalNotOnRemoteScan: extra.length,
    extraIds: extra.slice(0, 50),
    priceConflicts: priceConflicts.length,
    priceConflictSamples: priceConflicts.slice(0, 20),
    saleMembershipConflicts: saleMembershipConflicts.length,
    saleConflictSamples: saleMembershipConflicts.slice(0, 20),
    missingSku,
    missingDesc,
    brokenLocalImages: missingImages.length,
    brokenImageSamples: missingImages.slice(0, 20),
    duplicateSourceIds: dupSource,
    remoteByCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, v.length]),
    ),
  };

  mkdirSync(IMPORT_DIR, { recursive: true });
  writeFileSync(
    path.join(IMPORT_DIR, "catalog-audit.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));

  if (missing.length > 0) {
    console.log(`\n${missing.length} products missing locally — run: npm run import:catalog`);
  } else {
    console.log("\nNo missing remote products vs category scan.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
