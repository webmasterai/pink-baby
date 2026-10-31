import { homeCopy } from "@/content/pages";
import type { HomeCmsPayload } from "@/lib/cms/types";

/** Approved root catalog order for the homepage category grid (no sale). */
export const DEFAULT_HOME_CATEGORY_SLUGS = [
  "feeding-bottles",
  "breast-care",
  "pacifiers",
  "teats",
  "accessories",
] as const;

export function defaultHomeCategoryItems(): NonNullable<HomeCmsPayload["categoryItems"]> {
  return DEFAULT_HOME_CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export function defaultHomeSections(): HomeCmsPayload["sections"] {
  return [
    { key: "hero", visible: true, order: 1 },
    { key: "benefits", visible: true, order: 2 },
    { key: "categories", visible: true, order: 3 },
    { key: "featured", visible: true, order: 4 },
    { key: "promo", visible: true, order: 5 },
    { key: "newsletter", visible: true, order: 6 },
  ];
}

/**
 * Merge a stored homepage payload with structural defaults.
 * - Only `undefined` keys are filled; explicit values (including `[]` and `""`) are preserved.
 * - `categoryItems` undefined -> the 5 root catalog slugs; `[]` stays empty.
 * - `featuredProductIds` undefined stays undefined (storefront falls back to the
 *   featured flag); `[]` stays empty.
 */
export function normalizeHomePayload(
  raw: Partial<HomeCmsPayload> | HomeCmsPayload | null | undefined,
): HomeCmsPayload {
  const r: Partial<HomeCmsPayload> = raw ?? {};
  const out: HomeCmsPayload = {
    sections: r.sections ?? defaultHomeSections(),
    hero: {
      ...homeCopy.hero,
      image: "/images/hero.png",
      imageMobile: "/images/hero.png",
      ...stripUndefined(r.hero),
    },
    benefits: r.benefits ?? homeCopy.benefits.map((b) => ({ ...b })),
    categoriesHeading: r.categoriesHeading ?? homeCopy.categoriesHeading,
    categoriesSub: r.categoriesSub ?? homeCopy.categoriesSub,
    featuredHeading: r.featuredHeading ?? homeCopy.featuredHeading,
    featuredSub: r.featuredSub ?? homeCopy.featuredSub,
    promo: {
      ...homeCopy.promo,
      image: "/images/care-for-baby.png",
      ...stripUndefined(r.promo),
    },
    categoryItems: r.categoryItems ?? defaultHomeCategoryItems(),
    newsletter: {
      ...homeCopy.newsletter,
      successMessage: "Thanks — you are on the list.",
      ...stripUndefined(r.newsletter),
    },
  };
  if (r.featuredProductIds !== undefined) out.featuredProductIds = r.featuredProductIds;
  return out;
}

function stripUndefined<T extends object>(obj: T | undefined): Partial<T> {
  if (!obj) return {};
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
