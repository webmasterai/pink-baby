/**
 * Verify catalog + static media are present for a clean deploy.
 * Does not touch production or SQLite. Safe to run anytime.
 *
 *   node scripts/verify-deploy-assets.mjs
 *   npm run verify:assets
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

function ok(msg) {
  console.log("  ✓", msg);
}
function fail(msg) {
  errors.push(msg);
  console.log("  ✗", msg);
}
function warn(msg) {
  warnings.push(msg);
  console.log("  !", msg);
}

function collectImageRefsFromCatalog() {
  const catalogPath = path.join(ROOT, "content", "catalog.ts");
  if (!existsSync(catalogPath)) {
    fail("content/catalog.ts missing — generate once with import:catalog (then commit)");
    return { paths: [], productCount: 0, categoryCount: 0 };
  }
  const text = readFileSync(catalogPath, "utf8");
  const paths = [...text.matchAll(/"src":\s*"(\/images\/[^"]+)"/g)].map((m) => m[1]);
  const imageFields = [...text.matchAll(/"image":\s*"(\/images\/[^"]+)"/g)].map((m) => m[1]);
  const all = [...new Set([...paths, ...imageFields])];
  const productCount = (text.match(/"id":\s*"wc-/g) || []).length;
  const categoryCount = (text.match(/"slug":\s*"/g) || []).length;
  return { paths: all, productCount, categoryCount };
}

function checkPublicTree() {
  const root = path.join(ROOT, "public", "images");
  if (!existsSync(root)) {
    fail("public/images/ missing");
    return;
  }
  const productsDir = path.join(root, "products");
  if (!existsSync(productsDir)) {
    fail("public/images/products/ missing");
    return;
  }
  const files = readdirSync(productsDir).filter((f) =>
    /\.(jpe?g|png|webp|gif)$/i.test(f),
  );
  ok(`product image files on disk: ${files.length}`);
  if (files.length === 0) {
    fail("no product images under public/images/products/");
  }
}

function main() {
  console.log("[verify-deploy-assets]");

  const { paths, productCount } = collectImageRefsFromCatalog();
  if (productCount > 0) ok(`catalog products (wc-* ids): ${productCount}`);
  checkPublicTree();

  let missing = 0;
  for (const rel of paths) {
    const abs = path.join(ROOT, "public", rel.replace(/^\//, ""));
    if (!existsSync(abs)) {
      missing += 1;
      if (missing <= 12) fail(`missing file ${rel}`);
    }
  }
  if (missing > 12) fail(`…and ${missing - 12} more missing image paths`);
  if (missing === 0 && paths.length) {
    ok(`all ${paths.length} unique /images/* refs resolve on disk`);
  }

  const lifestyle = [
    "logo.png",
    "hero.png",
    "feeding.png",
    "breast.png",
    "pacifiers.png",
    "teats.png",
    "accessories.png",
    "care-for-baby.png",
  ];
  for (const name of lifestyle) {
    const p = path.join(ROOT, "public", "images", name);
    if (!existsSync(p)) warn(`optional lifestyle asset missing: /images/${name}`);
  }

  const dataDir = process.env.DATA_DIR || path.join(ROOT, "data");
  const sqlite = path.join(dataDir, "store", "pinkbaby.sqlite");
  if (existsSync(sqlite)) {
    const size = statSync(sqlite).size;
    ok(`local sqlite present (${size} bytes) — deploy uses volume DATA_DIR, not this file`);
  } else {
    warn("no local sqlite yet (ok for fresh clone; CMS_BOOTSTRAP seeds empty volume once)");
  }

  const uploads = path.join(dataDir, "uploads");
  if (existsSync(uploads)) {
    ok(`uploads dir exists at ${uploads} (runtime media; not in Git)`);
  } else {
    warn("uploads/ not created yet — CMS uploads land on DATA_DIR volume at runtime");
  }

  console.log("");
  console.log(
    JSON.stringify(
      {
        ok: errors.length === 0,
        errors: errors.length,
        warnings: warnings.length,
        catalogImageRefs: paths.length,
        productCount,
      },
      null,
      2,
    ),
  );

  if (errors.length) process.exit(1);
}

main();
