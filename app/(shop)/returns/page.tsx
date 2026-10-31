import type { Metadata } from "next";
import { PageSections } from "@/components/cms/PageSections";
import { PageHeader } from "@/components/ui/PageHeader";
import { returnsCopy } from "@/content/pages";
import { resolveCmsPreview } from "@/lib/cms/preview";
import { getPageContent } from "@/lib/cms/site-content";

export const metadata: Metadata = {
  title: "Returns / Exchange",
};

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ReturnsPage({ searchParams }: PageProps) {
  const preview = await resolveCmsPreview((await searchParams)?.preview);
  const cms = getPageContent("returns", { preview });

  if (cms) {
    return (
      <div className="pb-container py-12 md:py-16">
        <PageHeader title={cms.title || returnsCopy.title} description={cms.intro || undefined} />
        <PageSections sections={cms.sections} />
      </div>
    );
  }

  return (
    <div className="pb-container py-12 md:py-16">
      <PageHeader title={returnsCopy.title} description={returnsCopy.intro} />
      <ul className="mx-auto max-w-3xl list-disc space-y-3 pl-5 text-sm leading-relaxed text-pb-muted md:text-base">
        {returnsCopy.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
}
