# CMS content migrations

## What runs where

| Kind of change | How it ships |
|----------------|--------------|
| Code / layout / CSS | New application **build** (Docker image) |
| Targeted CMS field updates that must land on every environment | Versioned **content migration** in Git |
| Day-to-day editorial edits | CMS **Save draft → Publish** (no redeploy) |

Do **not** re-seed live storage on every deploy. Do **not** add a migration merely to “sync” unchanged seed copy.

See also **`docs/DEPLOY-DATA.md`** for catalog import, media, and volume transfer.

## Persistent storage (Coolify / Docker)

- Set `DATA_DIR=/data`
- Mount the volume at **`/data` only** — never over `/app` or `.next`
- SQLite: `/data/store/pinkbaby.sqlite`
- Uploads: `/data/uploads`
- Backups / migration locks: `/data/backups`, `/data/cms-migrate.lock`

Local default (no `DATA_DIR`): `<repo>/data/...` (unchanged).

## First install / empty volume

Empty production volumes are **not** silently filled with seed catalog/content.

1. Deploy the app with volume mounted at `/data`
2. Run **one** controlled bootstrap:
   - set `CMS_BOOTSTRAP=1` for a single restart, **or**
   - locally: `CMS_BOOTSTRAP=1 npx tsx -e "import { ensureCmsSeeded } from './lib/cms/seed.ts'; ensureCmsSeeded();"`
3. Create the owner with `node scripts/create-admin.mjs ...`
4. Remove `CMS_BOOTSTRAP` so later deploys never reseed

Dev (`NODE_ENV !== production`) still bootstraps automatically for local ergonomics.

## Startup sequence

1. `instrumentation.ts` → `runCmsStartup()`
2. Schema migrate (SQLite `CREATE TABLE IF NOT EXISTS` …)
3. Versioned content migrations (once each, locked)
4. Conditional bootstrap (see above)
5. Server serves traffic

Failed migrations throw and are recorded as `failed` with a pre-migration SQLite backup under `/data/backups/pre-migrate-*.sqlite`. The runner attempts restore; if restore fails, the process exits with an explicit error.

## Adding a migration

1. Create a file under `lib/cms/migrations/` (optional) or add an object in `lib/cms/migrations/registry.ts`.
2. Choose a unique `id` (e.g. `2026-10-31-home-promo-alt`) — never reuse.
3. In `up(ctx)`:
   - Validate inputs
   - Prefer `patchPublishedDocumentField({ docKey, fieldPath, expectedPrevious, nextValue, ctx })` so customized live values are preserved and reported as conflicts
   - Do **not** touch orders, customers, passwords, subscribers, enquiries, payments, or inventory tables
   - Respect intentional empty strings / `[]` / hidden sections
4. Append the migration to `contentMigrations` **in order**.
5. Run locally:

```bash
npx tsx scripts/cms-migrate.ts --dry-run
npx tsx scripts/cms-migrate.ts
npm test
npm run build
```

6. Commit the migration with the code that needs the content change.

### Example (do not invent content without a real need)

```ts
import type { ContentMigration } from "./types";
import { patchPublishedDocumentField } from "./helpers";

export const example: ContentMigration = {
  id: "2026-10-31-example-field",
  description: "Set home.promo.imageAlt when still at previous default",
  up(ctx) {
    patchPublishedDocumentField({
      docKey: "home",
      fieldPath: "promo.imageAlt",
      expectedPrevious: undefined,
      nextValue: "Breast-care essentials",
      ctx,
    });
  },
};
```

Then push `example` into `contentMigrations` in `registry.ts`.

## CLI

```bash
npm run cms:migrate:dry   # no writes
npm run cms:migrate       # apply pending
```

## Safety guarantees

- Each migration ID recorded in `cms_content_migrations` — reruns skip `applied`
- File lock prevents concurrent runners
- Pre-migration SQLite backup per migration
- Conflict = live value ≠ expected previous → leave live value, log conflict
- Dry run via `--dry-run` or `CMS_MIGRATE_DRY_RUN=1`
