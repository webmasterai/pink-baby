import type { Metadata } from "next";
import { PageSections } from "@/components/cms/PageSections";
import { PageHeader } from "@/components/ui/PageHeader";
import { privacyCopy } from "@/content/pages";
import { resolveCmsPreview } from "@/lib/cms/preview";
import { getPageContent } from "@/lib/cms/site-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PrivacyPage({ searchParams }: PageProps) {
  const preview = await resolveCmsPreview((await searchParams)?.preview);
  const cms = getPageContent("privacy", { preview });

  if (cms) {
    return (
      <div className="pb-container py-12 md:py-16">
        <PageHeader title={cms.title || privacyCopy.title} />
        {cms.intro ? (
          <p className="mx-auto mb-8 max-w-3xl rounded-xl bg-pb-blush px-4 py-3 text-sm text-pb-charcoal">
            {cms.intro}
          </p>
        ) : null}
        <PageSections sections={cms.sections} />
      </div>
    );
  }

  return (
    <div className="pb-container py-12 md:py-16">
      <PageHeader title={privacyCopy.title} />
      <p className="mx-auto mb-8 max-w-3xl rounded-xl bg-pb-blush px-4 py-3 text-sm text-pb-charcoal">
        {privacyCopy.draftNotice}
      </p>
      <div className="mx-auto max-w-3xl space-y-6">
        {privacyCopy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl font-bold">{section.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-pb-muted md:text-base">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
