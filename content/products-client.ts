/**
 * Client-safe product helpers backed by the imported catalog snapshot.
 * Do not import lib/db or CMS modules here.
 */
import {
  catalogProducts,
  getCatalogProductById,
  getCatalogProductBySlug,
  getCatalogProductsByCategory,
  getFeaturedCatalogProducts,
  searchCatalogProducts,
  type CatalogProduct,
} from "@/content/catalog";

export type Product = {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  categorySlugs: string[];
  image: string;
  imageAlt: string;
  images: { src: string; alt: string }[];
  shortDescription: string;
  description: string;
  featured: boolean;
  available: boolean;
  sku: string | null;
  sourceUrl: string;
  pricing: CatalogProduct["pricing"];
  attributes: CatalogProduct["attributes"];
  stockStatus: string;
  importedAt: string;
};

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

export function getAllProducts(): Product[] {
  return catalogProducts.map(toProduct);
}

export function getFeaturedProducts(): Product[] {
  return getFeaturedCatalogProducts().map(toProduct);
}

export function getProductBySlug(slug: string): Product | undefined {
  const p = getCatalogProductBySlug(slug);
  return p ? toProduct(p) : undefined;
}

export function getProductById(id: string): Product | undefined {
  const p = getCatalogProductById(id);
  return p ? toProduct(p) : undefined;
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return getCatalogProductsByCategory(categorySlug).map(toProduct);
}

export function searchProducts(query: string): Product[] {
  return searchCatalogProducts(query).map(toProduct);
}
