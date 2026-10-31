import type { MetadataRoute } from "next";
import { catalogCategories, catalogProducts } from "@/content/catalog";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/search",
    "/cart",
    "/wishlist",
    "/contact",
    "/about",
    "/delivery",
    "/faq",
    "/returns",
    "/privacy",
    "/terms",
    "/sale",
    "/account",
    "/checkout",
    "/order-tracking",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }));

  const categories = catalogCategories.map((c) => ({
    url: `${siteUrl}${c.href}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const products = catalogProducts.map((p) => ({
    url: `${siteUrl}/product/${p.slug}`,
    lastModified: new Date(p.importedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...categories, ...products];
}
