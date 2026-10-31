import type { NextRequest } from "next/server";

/**
 * Resolve a client IP for rate limiting.
 * Only trust X-Forwarded-For / X-Real-IP when TRUSTED_PROXY=true
 * (Coolify/Cloudflare reverse proxy deployments).
 */
export function getClientIp(request: NextRequest | Request): string {
  const trusted = process.env.TRUSTED_PROXY === "true";
  const headers =
    "headers" in request ? request.headers : new Headers();

  if (trusted) {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    const realIp = headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }

  return "unknown";
}
