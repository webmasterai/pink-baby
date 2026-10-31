# Pink Baby CMS — Local Setup

## Admin login URL

`http://127.0.0.1:3000/admin/login`

Unauthenticated visitors to `/admin` are redirected here.  
Storefront customers use **My account** and never receive CMS access from registration.

## Environment-based CMS authentication

CMS login reads **server-only** environment variables (not SQLite staff users):

| Variable | Purpose |
|----------|---------|
| `CMS_ADMIN_USERNAME` | Username or email accepted at `/admin/login` |
| `CMS_ADMIN_PASSWORD_HASH` | **bcrypt hash only** (never plaintext) |
| `CMS_SESSION_SECRET` | Signs the `pb_cms_session` cookie (min 32 chars) |

Also keep storefront CSRF secrets:

- `AUTH_SECRET=` (long random)
- `CSRF_SECRET=` (long random)
- `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000`

### Generate a password hash

```bash
npm run cms:hash-password
```

The script prints `CMS_ADMIN_PASSWORD_HASH=…` and a suggested `CMS_SESSION_SECRET`.  
Paste those into `.env.local` / Coolify. Do **not** put the plaintext password into `CMS_ADMIN_PASSWORD_HASH`.

Then open `/admin/login` and sign in with `CMS_ADMIN_USERNAME` and the plaintext password you typed into the generator.

Customer accounts, carts, and orders remain in SQLite and are unaffected.

## Coolify

Set these secrets on the Pink Baby service (do not commit them):

1. `CMS_ADMIN_USERNAME`
2. `CMS_ADMIN_PASSWORD_HASH` (from `npm run cms:hash-password`)
3. `CMS_SESSION_SECRET` (≥ 32 random characters)
4. `AUTH_SECRET`
5. `CSRF_SECRET`
6. `NEXT_PUBLIC_SITE_URL` (public HTTPS origin)
7. `DATA_DIR=/data` with a persistent volume mounted at `/data`

Redeploy after updating env. Logs mention **missing variable names only**, never secret values.

## Roles

The env CMS admin is treated as `owner` (full CMS).  
Storefront `customer` sessions cannot open `/admin` or `/api/admin/*`.

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
| Users, customer sessions, orders, CMS docs, products, media metadata, audit | `data/store/pinkbaby.sqlite` |
| CMS admin session | signed cookie `pb_cms_session` (env secret) |
| Uploaded media files | `data/uploads/` (served at `/uploads/...`) |
| Backups | `data/backups/*.sqlite` |

Production startup never reseeds products once seeded.

## Hosting notes

- Keep `data/` on a persistent volume.
- After backup restore, restart the Node process.
- Prefer `node .next/standalone/server.js` when using standalone output.
