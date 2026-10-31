import { SectionHeading } from "@/components/home/HeroMotion";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal, Stagger } from "@/components/ui/Reveal";
import { getFeaturedProducts, getProductById, type Product } from "@/content/products";
import { getHomeContent } from "@/lib/cms/site-content";
import type { HomeCmsPayload } from "@/lib/cms/types";

export function FeaturedProducts({ home: homeProp }: { home?: HomeCmsPayload }) {
  const home = homeProp ?? getHomeContent();
  const ids = home.featuredProductIds;
  const products: Product[] = Array.isArray(ids)
    ? ids.flatMap((id) => {
        const product = getProductById(id);
        return product ? [product] : [];
      })
    : getFeaturedProducts();

  return (
    <section className="bg-pb-ivory/60 py-12 md:py-14">
      <div className="pb-container">
        <Reveal>
          <SectionHeading title={home.featuredHeading} subtitle={home.featuredSub} />
        </Reveal>
        <Stagger
          className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4 lg:gap-6"
          maxStagger={8}
          stepMs={60}
        >
          {products.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
