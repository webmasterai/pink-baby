# Catalog completeness audit (2026-10-30)

Source: public WooCommerce Store API at https://pinkbaby.pk  
Script: `npm run audit:catalog` → `data/import/catalog-audit.json`

## Counts

| Metric | Count |
|---|---|
| Remote unique products (category scan) | **118** |
| Local products | **118** |
| Missing from local | **0** |
| Extra local not on remote scan | **0** |
| Duplicate source IDs | **0** |
| Broken local image files | **0** |
| Price conflicts (local vs live API) | **0** |
| Missing WC SKU field | **118** (codes often in product names) |
| Missing descriptions | **0** |

## Category totals (remote = local)

Accessories 16 · Feeding Bottles 54 · PP Standard 18 · PP Wide 3 · PPSU Wide 3 · PP Ultra Wideneck 28 · Glass 5 · Breast Care 3 · Pacifiers 15 · Teats 20 · Sale 10

## Conflicts (reported, not silently “fixed”)

**Sale membership vs sale pricing (10):** products in the `sale` category have Store API `on_sale: false` and no `sale_price`. Local UI lists them under Sale by category membership and only shows strikethrough when `pricing.onSale` is true.

## Import action

No missing public products to upsert. Re-run `npm run import:catalog` only when the remote catalog grows.
