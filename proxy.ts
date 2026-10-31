import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 request proxy (replaces deprecated middleware convention).
 * Adds basic security response headers for matched routes.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Staff preview hint for layout chrome (honored only after session check).
  const preview = request.nextUrl.searchParams.get("preview");
  if (preview === "1" || preview === "true") {
    response.cookies.set("pb_cms_preview", "1", {
      path: "/",
      maxAge: 60 * 60,
      sameSite: "lax",
      httpOnly: true,
    });
  } else if (preview === "0" || preview === "false") {
    response.cookies.set("pb_cms_preview", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      httpOnly: true,
    });
  }

  // Avoid caching personalized/cart-adjacent HTML at shared caches.
  if (
    request.nextUrl.pathname.startsWith("/cart") ||
    request.nextUrl.pathname.startsWith("/wishlist") ||
    request.nextUrl.pathname.startsWith("/account") ||
    request.nextUrl.pathname.startsWith("/checkout") ||
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/order-tracking") ||
    request.nextUrl.pathname.startsWith("/api/")
  ) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
