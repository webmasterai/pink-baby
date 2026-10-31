import { Benefits } from "@/components/home/Benefits";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { PromoBanner } from "@/components/home/PromoBanner";
import { Reveal } from "@/components/ui/Reveal";
import { resolveCmsPreview } from "@/lib/cms/preview";
import { getHomeContent } from "@/lib/cms/site-content";

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const preview = await resolveCmsPreview(sp.preview);
  const home = getHomeContent({ preview });
  const visible = new Set(
    home.sections
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.key),
  );

  const blocks: { key: string; node: React.ReactNode }[] = [
    { key: "hero", node: <Hero home={home} /> },
    { key: "benefits", node: <Benefits home={home} /> },
    { key: "categories", node: <CategoriesSection home={home} /> },
    { key: "featured", node: <FeaturedProducts home={home} /> },
    {
      key: "promo",
      node: (
        <Reveal>
          <PromoBanner home={home} />
        </Reveal>
      ),
    },
    {
      key: "newsletter",
      node: (
        <Reveal distance="sm">
          <NewsletterForm
            heading={home.newsletter.heading}
            text={home.newsletter.text}
            successMessage={home.newsletter.successMessage}
          />
        </Reveal>
      ),
    },
  ];

  return (
    <>
      {blocks
        .filter((b) => visible.has(b.key))
        .map((b) => (
          <div key={b.key}>{b.node}</div>
        ))}
    </>
  );
}
