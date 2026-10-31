/**
 * Next.js server register hook — runs once when the Node server starts.
 * @see https://nextjs.org/docs/app/guides/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  // Skip during `next build` static generation workers
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }
  const { runCmsStartup } = await import("@/lib/cms/startup");
  const result = await runCmsStartup();
  if (result.alreadyRan) return;
  const m = result.migrations;
  console.info(
    `[cms] startup ok — migrations applied=${m.applied.length} skipped=${m.skipped.length} conflicts=${m.conflicts.length}`,
  );
}
