# Pink Baby CMS — Frontend → Editor Coverage Matrix

Admin URL (local): `http://127.0.0.1:3000/admin`  
Storage: SQLite `data/store/pinkbaby.sqlite` + uploads `data/uploads/` (+ public `/images` seeded into media library)  
Initial admin: see `docs/CMS-SETUP.md`

Legend: **OK** = editable in CMS and rendered on storefront (draft → preview for staff → publish). **Partial** = editor exists; storefront wiring incomplete or dual-source. **Gap** = not fully editable yet.

| Frontend page / section | Text fields | Image fields | Admin editor | Test result |
|-------------------------|-------------|--------------|--------------|-------------|
| Top contact strip (phones, email, announcement) | WhatsApp/call/email displays; announcement/tagline | — | Contact & Social + Header & Announcement | OK — reads `site` + `header` |
| Header logo | — | Primary logo | Contact & Social (`logos.primary`) via MediaPicker | OK — `BrandLogo` uses CMS path |
| Header search / account / wishlist chrome | Feature toggles | — | Header & Announcement | OK — props from `header` doc |
| Primary mega-menu | Category names from catalog | — | Navigation (flat labels editable) | Partial — storefront still uses `content/categories` tree for mega-menu; CMS `nav` is editable but not driving Header yet |
| Homepage hero | line1/line2/support/CTA | Desktop + mobile hero | Homepage | OK — MediaPicker + `?preview=1` |
| Homepage benefits | title/text | Icon via IconPicker | Homepage | OK |
| Homepage categories band | heading/sub | Category images via Categories | Homepage + Categories | OK |
| Featured products band | heading/sub | Product thumbs | Homepage + Products | OK |
| Promo banner | heading/text/CTA | Promo image | Homepage | OK — MediaPicker |
| Newsletter band | heading/text/success | — | Homepage | OK |
| Footer blurb / columns / social / contact | blurb, column titles/links, legal name | Logo | Footer + Contact & Social | OK |
| WhatsApp FAB | — | — (href from site contact) | Contact & Social | OK |
| Favicon / SEO default OG | meta titles/descriptions | Favicon, default OG | Contact + SEO & Redirects | OK — root `generateMetadata` uses `site.logos.favicon`; SEO defaults editor for OG |
| About | title, intro, sections (+ optional section image) | Section images | Pages → About | OK — `getPageContent` + preview |
| Contact page | title, intro, sections | Section images | Pages → Contact + Contact & Social | OK — form + address box remain app chrome |
| Delivery / Returns / FAQ / Privacy / Terms | title, intro, sections/FAQ | Section images | Pages → each key | OK |
| Cart | title, intro, empty-state heading/body | — | Pages → Cart (+ Empty states) | OK — totals remain client logic |
| Checkout | title, intro, help richtext | — | Pages → Checkout | OK — payment methods/shipping from settings, not CMS |
| Wishlist | title, intro, empty state | — | Pages → Wishlist | OK |
| Account (logged out) | title, intro | — | Pages → Account | OK — auth forms not CMS |
| Account (logged in) | greeting uses user name | — | — | Gap — operational UI, not editorial |
| Order tracking | title, intro | — | Pages → Order tracking | OK — lookup API unchanged |
| Empty / search-not-found messages | headings/bodies | — | Pages → Empty states | Partial — cart/wishlist wired; search empty / 404 may still use static copy |
| Shop / category / sale / search listings | Product/category copy | Category + product images | Products + Categories | OK for CMS catalog; client cart name lookup still uses `products-client` snapshot (Partial) |
| PDP | title, descriptions, specs, variants, SEO | Main + gallery + variant images | Products editor (MediaPicker / GalleryPicker) | OK — product IDs preserved |
| Product/category admin lists | SKU, category, price, availability, status; hierarchy/order | Thumbnails | Products / Categories | OK |
| Promotional banners (home promo) | copy | image | Homepage | OK |
| Orders / customers / reviews / enquiries / subscribers | operational fields | — | respective admin pages | OK — not rewritten on publish |
| Shipping / payment customer notes | instructions, notes | — | Shipping & Payment Settings | OK — secrets stay env-only |
| Media library | alt, titles | uploads | Media Library + shared MediaPicker | OK — files under `data/uploads` |
| Staff profile & password | name, phone; password change | — | My Profile & Security | OK — bcrypt hash; other sessions destroyed |
| Admin users & roles | role changes | — | Admin Users (owner-only mutate) | OK — last-owner demotion blocked |
| Audit / backup | — | — | Audit History / Backup & Restore | OK |
| Draft / publish / conflict | toolbar dirty + revision messaging | preview links | StructuredDocForm / DocToolbar | OK — conflict tokens on documents; publish revalidates paths |
| Redirects | from/to | — | SEO & Redirects | Gap — stored with loop checks; not applied in `proxy.ts` (SQLite unavailable at edge) |

## Intentionally not editable via CMS (enforced in code)

| Item | Reason |
|------|--------|
| Checkout payment charging / webhooks | Provider credentials + verification |
| SMTP / payment secrets | Env-only; admin shows configured vs not |
| Placed order line prices / payment history rewrite | Integrity — status transitions only |
| Customer passwords / session tokens | Never exposed |
| Arbitrary HTML/JS widgets | Structured fields + sanitized rich text only |
| Cart/checkout totals & inventory math | Application logic — CMS supplies copy only |

## Remaining gaps (explicit)

1. **Header mega-menu** still uses the catalog category tree; CMS Navigation edits do not yet replace Header links.
2. **Search empty-state and global 404** copy may still be static despite `page:empty-states`.
3. **Client cart/wishlist product titles** resolve via `content/products-client` snapshot; server listings/PDP use SQLite CMS.
4. **Redirects** not applied at the edge proxy.
5. **Logged-in account** chrome is account UX, not a CMS page.
6. **Website-security skill file** was not present in the project skills cache; security follows existing auth (staff roles, CSRF, rate limits, hashed passwords, session invalidation, upload gated by admin APIs, audit log).

## Verification checklist (local, isolated, restore after)

| Step | Expected | Result |
|------|----------|--------|
| Replace homepage hero copy → Save draft → `/?preview=1` as staff → Publish → `/` | Draft in preview; live after publish | **PASS** (temp marker; restored) |
| Products list images + media library | Thumbs/API + seeded media | **PASS** (118 products, 187 media) |
| Change cart page copy → Publish | Header text updates; totals unchanged | **PASS** (restored) |
| Change header announcement → Publish | Strip updates | **PASS** (restored) |
| Change admin password | Other sessions 401; current usable; restore password | **PASS** |
| Upload to media library | File under `data/uploads` + `/uploads/...` | **PASS** (`media.path`) |
| Unauthenticated `POST` admin media | 401/403 | **PASS** (401) |
| Demote last owner | 400 Cannot remove the last owner | **PASS** |
| Restore temporary test content | Prior copy restored | **PASS** |

Do **not** claim “everything editable” while gaps 1–6 remain.
