import { ensureCmsSeeded, isCmsBootstrapped } from "@/lib/cms/seed";
import { runContentMigrations } from "@/lib/cms/migrations/runner";
import { getDb } from "@/lib/db";

let startupDone = false;

/**
 * Cold-start sequence for Node (instrumentation + Docker entrypoint):
 * 1. Open DB / schema migrate
 * 2. Run versioned content migrations (once each)
 * 3. Bootstrap seed only when allowed (never silently on empty prod volume)
 */
export async function runCmsStartup(opts?: { dryRunMigrations?: boolean }) {
  if (startupDone && !opts?.dryRunMigrations) return { alreadyRan: true as const };

  getDb();

  const migrations = await runContentMigrations({
    dryRun: opts?.dryRunMigrations,
  });

  const allowBootstrap =
    process.env.CMS_BOOTSTRAP === "1" ||
    process.env.NODE_ENV !== "production" ||
    isCmsBootstrapped();

  if (allowBootstrap) {
    ensureCmsSeeded();
  } else if (!isCmsBootstrapped()) {
    console.warn(
      "[cms] Persistent store is not bootstrapped. Skipping seed. " +
        "Set CMS_BOOTSTRAP=1 once on first install (see docs/CMS-CONTENT-MIGRATIONS.md).",
    );
  }

  if (!opts?.dryRunMigrations) startupDone = true;
  return { alreadyRan: false as const, migrations };
}
