# Catalog import reconciliation

- **Source:** https://pinkbaby.pk  
- **Imported at:** 2026-10-30T07:51:11.263Z  
- **Discovered unique / imported:** 118 / 118  
- **Images downloaded:** 161  
- **In stock / out of stock:** 94 / 24  

## Categories present locally

| Category | Count (import report) |
|---|---|
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

Missing products vs public discovery: **none** in the last import run (`discoveredUnique === imported`).

## Conflicts / data quality

1. **Sale category vs sale pricing flags**  
   10 products are assigned to the `sale` category, but Store API pricing for those items has `onSale: false` and `salePrice: null` (price equals regularPrice).  
   **Action:** Do not invent discounted prices. UI shows Sale membership via category; strikethrough only when `pricing.onSale` is true.

2. **SKU field empty for all 118 products**  
   WooCommerce `sku` was null on import. Many product **names** embed codes (e.g. `(SNG-123)`, `A-01`). Search includes name text so those codes remain findable.  
   **Action:** Re-import after SKUs are filled in WooCommerce, or map codes from names in a future controlled migration (not invented stock/SKU values).

3. **Listing vs detail sale-price differences**  
   No silent arbitrary price picks were made. Authoritative local price = Store API product `price` / `regular_price` / `sale_price` at import time. HTML listing scrapes were not used as overrides.

4. **Private data**  
   Customer accounts, passwords, and private orders were **not** imported.
