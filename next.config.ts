import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  // Only upgrade when the site is actually served over HTTPS.
  // Enabling this on plain HTTP localhost breaks asset loading.
  ...(process.env.ENABLE_CSP_UPGRADE_INSECURE === "true"
    ? ["upgrade-insecure-requests"]
    : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // DENY breaks some embedded preview browsers; SAMEORIGIN keeps clickjacking protection.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Keep Node built-in sqlite and native auth libs external to the server bundle.
  serverExternalPackages: ["bcryptjs"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      // Previous local demo product slugs → closest live catalog destinations
      {
        source: "/product/wide-neck-feeding-bottle-with-handles",
        destination: "/category/feeding-bottles/pp-wide-neck-bottle",
        permanent: true,
      },
      {
        source: "/product/manual-breast-pump",
        destination: "/category/breast-care",
        permanent: true,
      },
      {
        source: "/product/silicone-pacifier-set-2-pack",
        destination: "/category/pacifiers",
        permanent: true,
      },
      {
        source: "/product/soft-silicone-teat-2-pack",
        destination: "/category/teats",
        permanent: true,
      },
      // Source site category paths → local category routes
      {
        source: "/product-category/:slug",
        destination: "/category/:slug",
        permanent: true,
      },
      {
        source: "/product-category/:parent/:slug",
        destination: "/category/:parent/:slug",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          ...securityHeaders,
        ],
      },
    ];
  },
};

export default nextConfig;
