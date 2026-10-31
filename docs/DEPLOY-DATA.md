# Deploy data, media, and migrations

## What ships in Git vs volume

| Asset | Source of truth | How a clean deploy gets it |
|-------|-----------------|----------------------------|
| Product/category catalog + variants metadata | `content/catalog.ts` (+ shims) | **Commit** generated modules; do **not** re-import from WooCommerce on every deploy |
| Product photos referenced as `/images/products/…` | `public/images/products/` | **Commit** (or rsync into the image/build context). Not on `DATA_DIR` |
| Lifestyle/hero/category art | `public/images/*.png` | **Commit** with the app |
| SQLite schema | `lib/db.ts` `CREATE TABLE IF NOT EXISTS` | Auto on process start |
| CMS documents / products / orders / users | `DATA_DIR/store/pinkbaby.sqlite` | Persistent volume only — **never** commit |
| CMS uploads | `DATA_DIR/uploads` → `/uploads/…` | Persistent volume; transfer separately if migrating hosts |
| Versioned CMS field patches | `lib/cms/migrations/registry.ts` | Run on boot + `npm run cms:migrate` |

`data/*` is gitignored except `data/import/**` reports. Runtime DB and uploads must live on the Coolify/Docker volume (`DATA_DIR=/data`).

## Scripts (real ones)

### 1. Catalog import (WooCommerce → TypeScript + local images)

**One-time / exceptional regenerate** — not a deploy step.

```bash
npm run import:catalog:dry
# preview only: writes reports under data/import/, no content/*.ts, no new image downloads

npm run import:catalog -- --confirm-overwrite
# apply: backs up content modules, downloads missing images, regenerates catalog.ts
# refused if catalog.ts exists without --confirm-overwrite
```

- Stable product ids: `wc-<sourceId>`
- Image paths: `/images/products/<id>-<slug>-<n>.<ext>` (skip if file exists)
- Does **not** mutate SQLite `cms_products` (bootstrap seeds only when the table is empty)
- Rollback: restore `data/import/backups/<timestamp>/` into `content/`

**Do not** re-import the old site after the catalog is finalized.

### 2. CMS content migrations

```bash
npm run cms:migrate:dry
npm run cms:migrate
```

Isolated local copy (recommended before push):

```bash
# PowerShell
$env:DATA_DIR = "$PWD/tests/.tmp-mig-verify"
New-Item -ItemType Directory -Force $env:DATA_DIR | Out-Null
# Copy existing sqlite if you want to dry-run against a clone of local data:
# Copy-Item data/store/pinkbaby.sqlite "$env:DATA_DIR/store/pinkbaby.sqlite"
npm run cms:migrate:dry
Remove-Item -Recurse -Force tests/.tmp-mig-verify
```

Registry may be empty (`contentMigrations = []`) when no field patches are pending — dry-run still succeeds and reports registered/applied.

### 3. Schema

No separate SQL migration runner. Opening the DB applies additive `CREATE TABLE IF NOT EXISTS` / indexes in `lib/db.ts`.

### 4. Asset verification

```bash
npm run verify:assets
```

Fails if catalog image paths are missing under `public/`.

### 5. Admin bootstrap (empty volume)

```bash
# one restart only
CMS_BOOTSTRAP=1
node scripts/create-admin.mjs --email … --password … --name … --role owner
# then unset CMS_BOOTSTRAP
```

## Persistent storage checklist (Coolify)

1. Mount volume at **`/data`** only (`DATA_DIR=/data`)
2. Do **not** mount over `/app` or `.next`
3. Transfer `public/images` via the Docker build (Git), not the volume
4. If moving hosts: dump `/data/store/pinkbaby.sqlite` + `/data/uploads` and restore onto the new volume
5. Never commit `.env`, sqlite, or upload binaries

## Backup / rollback

| Layer | Backup | Rollback |
|-------|--------|----------|
| Catalog modules | `data/import/backups/<ts>/` before import apply | Copy files back to `content/` |
| SQLite (CMS migrate) | `DATA_DIR/backups/pre-migrate-*.sqlite` | Runner auto-restores on failure; or replace sqlite and restart |
| Manual SQLite | Admin backup / `lib/cms/backup.ts` | Restore file, restart Node |
