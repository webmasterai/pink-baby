# Catalog migration report (pinkbaby.pk → local)

**Imported at:** see `import-report.json`  
**Source:** https://pinkbaby.pk (public WooCommerce Store API)  
**Importer:** `npm run import:catalog` / `npm run import:catalog:dry`

## Totals

| Metric | Count |
| --- | --- |
| Unique products discovered | 118 |
| Unique products imported | 118 |
| In stock | 94 |
| Out of stock | 24 |
| Product images downloaded | 161 |
| Image download errors | 0 |
| Missing required fields | 0 |

## Per-category product counts (products may appear in multiple categories)

| Category | Count |
| --- | --- |
| Accessories | 16 |
| Feeding Bottles | 54 |
| PP Standard Neck Bottle | 18 |
| PP Wide Neck Bottle | 3 |
| PPSU Wide Neck Bottle | 3 |
| PP Ultra Wideneck Bottle | 28 |
| Glass Bottles | 5 |
| Breast Care | 3 |
| Pacifiers | 15 |
| Teats | 20 |
| Sale | 10 |

## Notes

- Snapshot migration only — not live stock sync.
- Accessories products often return empty `categories[]` from the Store API; they were still imported via category-filtered requests and tagged with `accessories`.
- All Store API products were `simple` (no variant matrices exposed). Attributes/variations arrays were preserved when present.
- Local media: `public/images/products/` with source URL mapping in `products.normalized.json`.
- URL mapping: `content/url-mapping.json`.
- Previous content backups: `data/import/backups/`.
- Website-security skill file was unavailable; validation/rate-limit/header practices from the project brief remain in place.
