import {
  catalogCategories,
  getCategoryBySlug as getCat,
  getChildCategories,
  getRootCategories,
  type CatalogCategory,
} from "@/content/catalog";

export type Category = {
  slug: string;
  name: string;
  href: string;
  image: string;
  imageAlt: string;
  description: string;
  parentSlug?: string | null;
  children?: Category[];
};

/** Approved homepage / nav order (not alphabetical). */
const ROOT_ORDER = [
  "feeding-bottles",
  "breast-care",
  "pacifiers",
  "teats",
  "accessories",
] as const;

function toCategory(c: CatalogCategory): Category {
  return {
    slug: c.slug,
    name: c.displayName,
    href: c.href,
    image: c.image,
    imageAlt: `${c.displayName} products`,
    description: `Browse ${c.displayName} from Pink Baby.`,
    parentSlug: c.parentSlug,
  };
}

function sortRoots(list: CatalogCategory[]) {
  return [...list].sort((a, b) => {
    const ai = ROOT_ORDER.indexOf(a.slug as (typeof ROOT_ORDER)[number]);
    const bi = ROOT_ORDER.indexOf(b.slug as (typeof ROOT_ORDER)[number]);
    const ax = ai === -1 ? 999 : ai;
    const bx = bi === -1 ? 999 : bi;
    return ax - bx || a.displayName.localeCompare(b.displayName);
  });
}

export const categories: Category[] = sortRoots(
  getRootCategories().filter((c) => c.slug !== "sale"),
).map((c) => ({
  ...toCategory(c),
  children: getChildCategories(c.slug).map(toCategory),
}));

export const navLinks = [
  ...categories.map((c) => ({ name: c.name, href: c.href })),
  { name: "Sale", href: "/sale" },
] as const;

export function getCategoryBySlug(slug: string): Category | undefined {
  const found = getCat(slug);
  return found ? toCategory(found) : undefined;
}

export function getAllCategoriesFlat(): Category[] {
  return catalogCategories.map(toCategory);
}

export { getChildCategories, getRootCategories };
