# Pink Baby CMS — Local Setup

## Admin login URL

`http://127.0.0.1:3000/admin/login`

Unauthenticated or non-staff visitors to `/admin` are redirected here.  
Storefront customers are **not** treated as admins and are not sent to `/account?next=/admin`.

## Secure initial admin (no hardcoded passwords)

Staff accounts are **not** created by registering on the storefront.  
`ADMIN_EMAILS` no longer auto-promotes customers on register/login.

```bash
node scripts/create-admin.mjs --email you@example.com --password "ChooseAStrongPass1!" --name "Owner" --role owner
```

Then open `/admin/login` and sign in with that email and password.

Required env (`.env.local`):

- `AUTH_SECRET=` (long random)
- `CSRF_SECRET=` (long random)
- `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000`

Optional: `ADMIN_EMAILS` may still be listed for ops notes, but it does **not** grant CMS access by itself.

## Roles

| Role | Access |
|------|--------|
| `owner` / `admin` | Full CMS |
| `editor` | Content, products, media, reviews, enquiries, subscribers |
| `order_manager` | Orders, customers, enquiries |
| `customer` | Storefront only — blocked from `/admin` and `/api/admin/*` |

## Content migrations (deploys)

Versioned CMS field updates run on boot via `instrumentation.ts`.  
See **`docs/CMS-CONTENT-MIGRATIONS.md`**. Do not reseed on every deploy.

```bash
npm run cms:migrate:dry
npm run cms:migrate
```

Empty production volume: set `CMS_BOOTSTRAP=1` for one restart only, then remove it.

## Persistence

| Data | Location |
|------|----------|
| Users, sessions, orders, CMS docs, products, media metadata, audit | `data/store/pinkbaby.sqlite` |
| Uploaded media files | `data/uploads/` (served at `/uploads/...`) |
| Backups | `data/backups/*.sqlite` |

Production startup never reseeds products once seeded.

## Hosting notes

- Keep `data/` on a persistent volume.
- After backup restore, restart the Node process.
- Prefer `node .next/standalone/server.js` when using standalone output.
