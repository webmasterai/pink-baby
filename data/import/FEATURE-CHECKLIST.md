# Pink Baby feature checklist

Source audit: public storefront `https://pinkbaby.pk/` (and category/product pages).  
Local design: new pink storefront (not the old blue header).

| Feature | Original store | Local status | Notes |
|---|---|---|---|
| Catalog browse / categories | Yes | **Implemented / verified** | Roots + feeding-bottle subcategories + Sale |
| Product detail pages | Yes | **Implemented / verified** | Gallery, zoom, WhatsApp, wishlist, cart |
| Search | Yes | **Implemented / verified** | Name + SKU-ish text; filters + sort + pagination |
| Cart | Yes | **Implemented / verified** | Guest localStorage + account merge |
| Wishlist | Yes | **Implemented / verified** | Guest + account sync |
| Checkout | Yes (WooCommerce) | **Implemented (order request)** | Durable SQLite orders; shipping/payments gated by env |
| COD / card / bank | Unknown / unverified | **Awaiting configuration** | Hidden until `ENABLE_*` + credentials |
| Accounts | Yes | **Implemented / verified** | Register/login/logout, reset tokens, addresses, orders |
| Order tracking | Yes | **Implemented / verified** | Reference + email/phone; no cross-customer leak |
| Admin orders | Likely WP admin | **Implemented (minimal)** | `/admin/orders` for `ADMIN_EMAILS` |
| Newsletter | Yes | **Existing** | File-backed |
| Contact form | Yes | **Existing** | File-backed + rate limit |
| WhatsApp / phone | Yes | **Implemented** | Contact strip + FAB + PDP prefill |
| Reviews | Possible | **Implemented** | Stored + moderated; no fake ratings |
| Delivery / returns / FAQ / privacy / terms | Partial | **Implemented (draft-aware)** | No invented guarantees |
| Email delivery | Likely | **Awaiting SMTP** | Tokens logged in non-prod when SMTP unset |
| Cloudflare / hosting | Unknown | **Not verified** | Not inspected |
| Customer password migration | N/A | **Not done** | Never scrape private accounts |

## Remaining business configuration

- `AUTH_SECRET` / `CSRF_SECRET` (required for production)
- `CMS_ADMIN_USERNAME` / `CMS_ADMIN_PASSWORD_HASH` / `CMS_SESSION_SECRET` (CMS login)
- `ADMIN_EMAILS`
- `SHIPPING_FLAT_PKR` (optional; otherwise shipping TBC)
- `ENABLE_COD` / `ENABLE_BANK_TRANSFER` + bank instructions / card test provider secrets
- `SMTP_*` for verification, reset, and order emails
- Payment provider webhooks before treating any order as paid
