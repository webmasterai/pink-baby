# Homepage CMS coverage

Admin: `/admin/homepage`  
Shared chrome: `/admin/header`, `/admin/contact`, `/admin/navigation`, `/admin/footer`  
Storage: `cms_documents.home` (+ `header` / `footer` / `site` / `nav`)

| Section | Editable fields | CMS location | Frontend publish test |
|---------|-----------------|--------------|------------------------|
| Header & Announcement Bar | Announcement text/visibility; search/wishlist/account toggles; phones/email/logo via Contact | Homepage → link to **Header**, **Contact**, **Navigation** (single source; not duplicated) | **PASS** — announcement marker rendered in homepage chrome after publish; restored |
| Hero | line1, line2, support, CTA label/href, desktop/mobile images + alt, object position | `/admin/homepage` → Hero | **PASS** — draft hidden from public; preview + publish showed text/CTA/image; restored |
| Benefits / Trust Strip | title, text, icon (IconPicker), add/remove/reorder | `/admin/homepage` → Benefits | **PASS** — title/text on live HTML; restored |
| Categories — “Made for every little moment” | heading, subtitle; selected catalog categories; title/image/alt overrides; reorder/add/remove | `/admin/homepage` → Categories | **PASS** — heading, title override, category hrefs on live; order reflected; restored |
| Featured Products — “Everyday favourites” | heading, subtitle; product IDs (search/select with thumb/name/SKU); reorder; Edit product link | `/admin/homepage` → Featured | **PASS** — selected product names on live in CMS order; prices still from catalog; restored |
| Breast Care / Promotional Banner | heading, text, CTA, image + alt, object position | `/admin/homepage` → Promo | **PASS** — text/CTA/href live; visibility off removes section; restored |
| Newsletter | heading, text, success message | `/admin/homepage` → Newsletter | **PASS** — copy on live; subscribe API unchanged; restored |
| Footer | blurb, columns/links, contact/social toggles; logo/contact from site | Homepage → link to **Footer** + **Contact** | **PASS** — blurb on homepage footer after publish; restored |
| Section visibility & order | per-section visible + order | `/admin/homepage` → Section visibility & order | **PASS** — hiding promo removed it from HTML |

## Data flow

Admin form → `PUT /api/admin/cms/documents/home` (draft + conflict token) → `POST .../publish` → `revalidatePath("/")` → `getHomeContent()` / layout chrome → home components.

- **Draft** does not change the public site.
- **`?preview=1`** + staff session reads editable/draft payload.
- **Publish** updates storefront without rebuild.
- **`normalizeHomePayload`**: fills only `undefined` keys; intentional `[]` / `""` preserved.

## Remaining gaps / non-claims

1. **Primary mega-menu** still uses the catalog category tree in `Header`; CMS Navigation is editable but not yet the Header driver (linked from homepage for editors).
2. **Featured fallback**: if `featuredProductIds` is omitted (`undefined`), storefront still uses the product `featured` flag — intentional until an editor picks an explicit list.
3. **Category cards** resolve base slug/image from the catalog helper; CMS category record image is used when set as an override (or after selecting override in the homepage editor).
4. Do **not** claim the whole storefront is fully editable from this page alone — only homepage sections above (plus linked global chrome).

## Verification run (local)

Isolated draft → preview → publish → HTML assert → restore for hero, benefits, categories, featured products, promo (incl. hide), newsletter, header announcement, footer blurb — **32/32 PASS**.
