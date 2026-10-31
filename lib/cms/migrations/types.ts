export type MigrationConflict = {
  path: string;
  expected: unknown;
  actual: unknown;
  message: string;
};

export type MigrationContext = {
  dryRun: boolean;
  /** Record a non-fatal conflict (customized live value preserved). */
  reportConflict: (conflict: MigrationConflict) => void;
};

export type ContentMigration = {
  /** Unique stable ID tracked in Git and `cms_content_migrations`. */
  id: string;
  description: string;
  /**
   * Apply targeted content changes. Must be idempotent.
   * Throw to abort the whole migration (caller restores backup when possible).
   */
  up: (ctx: MigrationContext) => void | Promise<void>;
};
