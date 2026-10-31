import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { faqItems } from "@/content/pages";
import { resolveCmsPreview } from "@/lib/cms/preview";
import { getPageContent } from "@/lib/cms/site-content";

export const metadata: Metadata = {
  title: "FAQ",
};

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function FaqPage({ searchParams }: PageProps) {
  const preview = await resolveCmsPreview((await searchParams)?.preview);
  const page = getPageContent("faq", { preview });
  const faqSection = page?.sections.find((s) => s.type === "faq");
  const items =
    faqSection && faqSection.type === "faq" && faqSection.items.length
      ? faqSection.items
      : faqItems.map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <div className="pb-container py-12 md:py-16">
      <PageHeader
        title={page?.title || "FAQ"}
        description={page?.intro || "Common questions about shopping with Pink Baby."}
      />
      <div className="mx-auto max-w-3xl space-y-3">
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border border-pb-border bg-white px-5 py-4"
          >
            <summary className="cursor-pointer list-none font-semibold text-pb-charcoal marker:content-none">
              <span className="flex items-center justify-between gap-3">
                {item.question}
                <span className="text-pb-pink transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-pb-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
