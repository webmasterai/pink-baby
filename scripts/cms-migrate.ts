/**
 * CLI: apply (or dry-run) versioned CMS content migrations.
 *
 *   npx tsx scripts/cms-migrate.ts
 *   npx tsx scripts/cms-migrate.ts --dry-run
 */
import { runContentMigrations, getMigrationStatus } from "../lib/cms/migrations/runner";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const statusBefore = getMigrationStatus();
  console.log("[cms] registered:", statusBefore.registered);
  console.log("[cms] already applied:", statusBefore.applied);

  const result = await runContentMigrations({ dryRun });
  console.log("[cms] dryRun:", result.dryRun);
  console.log("[cms] applied:", result.applied);
  console.log("[cms] skipped:", result.skipped);
  if (result.conflicts.length) {
    console.log("[cms] conflicts:");
    for (const c of result.conflicts) {
      console.log(" -", c.path, c.message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
