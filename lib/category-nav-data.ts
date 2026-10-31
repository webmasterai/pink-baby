import { categories } from "@/content/categories";
import { getAllProducts } from "@/content/products";

export type NavChild = {
  slug: string;
  name: string;
  href: string;
  count: number;
};

export type NavCategory = {
  slug: string;
  name: string;
  href: string;
  count: number;
  children: NavChild[];
};

export type CategoryNavData = {
  total: number;
  saleCount: number;
  categories: NavCategory[];
};

export function getCategoryNavData(): CategoryNavData {
  const products = getAllProducts();
  const countFor = (slug: string) =>
    products.filter((p) => p.categorySlugs.includes(slug)).length;

  return {
    total: products.length,
    saleCount: countFor("sale"),
    categories: categories.map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      href: cat.href,
      count: countFor(cat.slug),
      children: (cat.children || []).map((child) => ({
        slug: child.slug,
        name: child.name,
        href: child.href,
        count: countFor(child.slug),
      })),
    })),
  };
}
