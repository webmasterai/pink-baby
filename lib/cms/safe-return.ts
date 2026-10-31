/**
 * Validate post-login return paths. Only same-origin relative admin paths.
 */
export function safeAdminReturnPath(
  raw: string | null | undefined,
  fallback = "/admin",
): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("://") || value.includes("\\")) return fallback;
  // Admin panel only — never bounce to arbitrary storefront deep links via open redirect
  if (!value.startsWith("/admin")) return fallback;
  if (value.startsWith("/admin/login")) return fallback;
  return value;
}
