/**
 * Server product helpers — prefer CMS SQLite when seeded; fall back to catalog.
 * Client components must import from `@/content/products-client` instead
 * (never import this module from `"use client"` files).
 */
import type { CatalogProduct } from "@/content/catalog";
import {
  catalogProducts,
  getCatalogProductById,
  getCatalogProductBySlug,
  getCatalogProductsByCategory,
  getFeaturedCatalogProducts,
  searchCatalogProducts,
} from "@/content/catalog";
import {
  getCmsProductById,
  getCmsProductBySlug,
  listPublishedProducts,
  toStorefrontProduct,
} from "@/lib/cms/products";
import { ensureCmsReady } from "@/lib/cms/runtime";
import type { Product as ClientProduct } from "@/content/products-client";

export type Product = ClientProduct;

function toProduct(p: CatalogProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    categorySlug: p.primaryCategorySlug || p.categorySlugs[0] || "accessories",
    categorySlugs: p.categorySlugs,
    image: p.image,
    imageAlt: p.imageAlt,
    images: p.images.map((i) => ({ src: i.src, alt: i.alt })),
    shortDescription: p.shortDescription,
    description: p.description || p.shortDescription,
    featured: p.featured,
    available: p.available,
    sku: p.sku,
    sourceUrl: p.sourceUrl,
    pricing: p.pricing,
    attributes: p.attributes,
    stockStatus: p.stockStatus,
    importedAt: p.importedAt,
  };
}

let cmsActive: boolean | null = null;

function cmsCatalogReady(): boolean {
  // Avoid opening SQLite across parallel static workers during `next build`.
  if (process.env.NEXT_PHASE === "phase-production-build") return false;
  if (cmsActive != null) return cmsActive;
  try {
    ensureCmsReady();
    cmsActive = listPublishedProducts().length > 0;
  } catch {
    cmsActive = false;
  }
  return cmsActive;
}

export function getAllProducts(): Product[] {
  if (cmsCatalogReady()) return listPublishedProducts().map(toStorefrontProduct);
  return catalogProducts.map(toProduct);
}

export function getFeaturedProducts(): Product[] {
  if (cmsCatalogReady()) {
    return listPublishedProducts()
      .filter((p) => p.featured)
      .map(toStorefrontProduct);
  }
  return getFeaturedCatalogProducts().map(toProduct);
}

export function getProductBySlug(slug: string): Product | undefined {
  if (cmsCatalogReady()) {
    const p = getCmsProductBySlug(slug);
    return p ? toStorefrontProduct(p) : undefined;
  }
  const p = getCatalogProductBySlug(slug);
  return p ? toProduct(p) : undefined;
}

export function getProductById(id: string): Product | undefined {
  if (cmsCatalogReady()) {
    const p = getCmsProductById(id);
    if (!p || p.status !== "published") return undefined;
    return toStorefrontProduct(p);
  }
  const p = getCatalogProductById(id);
  return p ? toProduct(p) : undefined;
}

export function getProductsByCategory(categorySlug: string): Product[] {
  if (cmsCatalogReady()) {
    return listPublishedProducts()
      .filter(
        (p) =>
          p.primaryCategorySlug === categorySlug ||
          p.categorySlugs.includes(categorySlug),
      )
      .map(toStorefrontProduct);
  }
  return getCatalogProductsByCategory(categorySlug).map(toProduct);
}

export function searchProducts(query: string): Product[] {
  if (cmsCatalogReady()) {
    const q = query.trim().toLowerCase();
    if (!q) return getAllProducts();
    return listPublishedProducts()
      .filter((p) => {
        const hay = [p.name, p.sku, p.shortDescription, ...p.categorySlugs]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .map(toStorefrontProduct);
  }
  return searchCatalogProducts(query).map(toProduct);
}

export type { CatalogProduct };
