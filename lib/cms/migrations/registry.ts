import type { ContentMigration } from "@/lib/cms/migrations/types";

/**
 * Register content migrations here in ascending order.
 *
 * Code/layout changes ship with the app build — do NOT add a migration for CSS/JS.
 * Live CMS edits are published by editors — do NOT duplicate them here.
 * Only add a migration when a deploy must patch specific stored CMS fields.
 *
 * See docs/CMS-CONTENT-MIGRATIONS.md.
 *
 * Intentionally empty: no fictional content sync. Add real migrations as needed.
 */
export const contentMigrations: ContentMigration[] = [];
