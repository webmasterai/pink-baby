import { ensureCmsSeeded, isCmsBootstrapped } from "@/lib/cms/seed";
import { getDb } from "@/lib/db";

let ready = false;

/**
 * Ensure DB schema is open and, when allowed, CMS bootstrap has run.
 * Content migrations run via `runCmsStartup` (instrumentation / Docker entrypoint),
 * not on every request.
 */
export function ensureCmsReady() {
  if (ready) return;
  getDb();

  const allowBootstrap =
    process.env.CMS_BOOTSTRAP === "1" ||
    process.env.NODE_ENV !== "production" ||
    isCmsBootstrapped();

  if (allowBootstrap) {
    ensureCmsSeeded();
  }

  ready = true;
}
