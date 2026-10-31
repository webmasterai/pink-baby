# Pink Baby — handoff

## Local preview

```bash
npm ci
npm run dev
```

Open http://localhost:3000

Verified locally against the approved homepage mockup at desktop (~1440) and mobile (~390). Cart/wishlist/search/category/product routes and newsletter persistence were smoke-tested.

## Catalog migration

Public WooCommerce Store API import from https://pinkbaby.pk:

```bash
npm run import:catalog:dry
npm run import:catalog
```

See `data/import/MIGRATION.md` and `data/import/import-report.json`.

**Snapshot:** 118 unique products (94 in stock / 24 out of stock), 161 local product images, 0 download errors. Subcategories under Feeding Bottles included.

## Resolved versions (lockfile authoritative)

| Package | Version |
| --- | --- |
| Node (Docker / `.nvmrc`) | 26.13.0 LTS |
| Node (`package.json` engines floor) | >=20.9.0 (Next.js 16 minimum) |
| Next.js | 16.4.3 |
| React / React DOM | 19.3.0 |
| TypeScript | 5.9.3 |
| Tailwind CSS | 4.3.3 |
| Zod | 4.6.7 |

Docker Desktop was not running during verification, so the image build was not executed here. Use `docker build -t pink-baby .` once the daemon is available.

## Website-security skill

No `website-security` skill file was found in the workspace or installed Cursor skills. Protections from the project brief were applied instead (validation, rate limits, headers, no secrets in client, honest form states, private cache on sensitive routes).

## Working features

- Homepage matching approved section order
- Category, product, search, wishlist, cart
- Contact + newsletter APIs with server validation, body size limits, rate limiting, file-backed storage, duplicate newsletter prevention
- FAQ, returns, privacy, terms, sale (empty until verified sale items)
- Health endpoint `/api/health`
- Accessible mobile menu (`<dialog>`), keyboard-focus styles, reduced-motion CSS

## Pending integrations (honest UI only)

- Account authentication
- Checkout / payments (no card fields collected)
- Order tracking results
- Outbound SMTP email (submissions still save when `DATA_DIR` is writable)

## Review placeholders

Update `content/site.ts` contact + social URLs before launch (`[REVIEW]` markers).

## Assets

Individual hero/category/product/promo photos were **not** supplied separately. Crops were derived from the approved homepage mockup (low resolution) plus an SVG logo recreation. Replace with original high-resolution assets when available under `public/images/`.

## Coolify / Docker

- Internal port: **3000** (`0.0.0.0`)
- Multi-stage `Dockerfile`, non-root `nextjs` user, standalone output
- Mount persistent volume at **`/data`** with `DATA_DIR=/data` (SQLite, uploads, backups, migration lock)
- Do **not** mount a volume over `/app` or `.next`
- Content migrations run on boot via `instrumentation.ts` (see `docs/CMS-CONTENT-MIGRATIONS.md`)
- First install on an empty volume: set `CMS_BOOTSTRAP=1` for **one** restart, create admin, then remove it
- Set `TRUSTED_PROXY=true` behind Coolify/Cloudflare
- Cloudflare WAF/DNS/HTTPS/backups are **not** verified from this repo — configure in the provider dashboards

## Security controls implemented

- Zod validation + request body size limits
- In-memory rate limiting (per process; use Redis for multi-instance)
- Security headers including CSP (test against fonts/images after deploy)
- `Cache-Control: private, no-store` on cart/wishlist/account/checkout/API via `proxy.ts`
- Server-only env vars for SMTP; `.env.example` placeholders only
- No public exposure of `data/` JSON stores
- No fake auth/payment success paths

## Cloudflare / Coolify (document separately)

Not claimed configured: WAF rules, DNS, firewall, managed HTTPS, provider backups, secret stores. Verify in each dashboard.

## Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
docker build -t pink-baby .
docker run --rm -p 3000:3000 -e DATA_DIR=/data -v pinkbaby-data:/data pink-baby
```
