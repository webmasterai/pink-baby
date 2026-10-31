import { CategoryCard } from "@/components/product/CategoryCard";
import { SectionHeading } from "@/components/home/HeroMotion";
import { Reveal, Stagger } from "@/components/ui/Reveal";
import { categories, getCategoryBySlug, type Category } from "@/content/categories";
import { getHomeContent } from "@/lib/cms/site-content";
import type { HomeCmsPayload } from "@/lib/cms/types";

export function CategoriesSection({ home: homeProp }: { home?: HomeCmsPayload }) {
  const home = homeProp ?? getHomeContent();
  // Use Array.isArray so intentional `[]` stays empty (do not treat as falsy).
  const items: Category[] = Array.isArray(home.categoryItems)
    ? home.categoryItems.flatMap((item) => {
        const base = getCategoryBySlug(item.slug);
        if (!base) return [];
        const title = item.titleOverride?.trim();
        const image = item.imageOverride?.trim();
        const imageAlt = item.imageAltOverride?.trim();
        return [
          {
            ...base,
            name: title || base.name,
            image: image || base.image,
            imageAlt: imageAlt || (title ? `${title} products` : base.imageAlt),
          },
        ];
      })
    : categories;
  return (
    <section className="bg-white py-12 md:py-14">
      <div className="pb-container">
        <Reveal>
          <SectionHeading title={home.categoriesHeading} subtitle={home.categoriesSub} />
        </Reveal>
        <Stagger
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-5 lg:gap-6"
          maxStagger={8}
          stepMs={55}
        >
          {items.map((category) => (
            <div key={category.slug}>
              <CategoryCard category={category} />
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
