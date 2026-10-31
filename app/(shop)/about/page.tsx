import type { Metadata } from "next";
import { PageSections } from "@/components/cms/PageSections";
import { PageHeader } from "@/components/ui/PageHeader";
import { siteConfig } from "@/content/site";
import { resolveCmsPreview } from "@/lib/cms/preview";
import { getPageContent } from "@/lib/cms/site-content";

export const metadata: Metadata = { title: "About" };

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AboutPage({ searchParams }: PageProps) {
  const preview = await resolveCmsPreview((await searchParams)?.preview);
  const cms = getPageContent("about", { preview });

  if (cms) {
    return (
      <div className="pb-container py-10 md:py-12">
        <PageHeader title={cms.title || `About ${siteConfig.name}`} description={cms.intro || undefined} />
        <PageSections sections={cms.sections} />
      </div>
    );
  }

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader
        title={`About ${siteConfig.name}`}
        description={siteConfig.description}
      />
      <div className="prose-pb mx-auto max-w-3xl space-y-4 text-sm leading-relaxed text-pb-muted md:text-base">
        <p>
          {siteConfig.name} offers thoughtful feeding and care essentials for families in
          Pakistan. Our public storefront at pinkbaby.pk lists bottles, breast-care products,
          pacifiers, teats, and accessories.
        </p>
        <p>
          Business location (public listing): {siteConfig.contact.addressLines.join(", ")}.
        </p>
        <p>
          Contact: WhatsApp {siteConfig.contact.whatsapp.display}, call{" "}
          {siteConfig.contact.call.display}, or email {siteConfig.contact.email}.
        </p>
        <p>
          This site preserves catalog details imported from the public store. We do not invent
          certifications, guarantees, or stock beyond what the source catalog provides.
        </p>
      </div>
    </div>
  );
}
