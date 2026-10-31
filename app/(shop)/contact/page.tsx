import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageSections } from "@/components/cms/PageSections";
import { getPageContent } from "@/lib/cms/site-content";
import { resolveCmsPreview } from "@/lib/cms/preview";
import { PageHeader } from "@/components/ui/PageHeader";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
};

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ContactPage({ searchParams }: PageProps) {
  const preview = await resolveCmsPreview((await searchParams)?.preview);
  const cms = getPageContent("contact", { preview });

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader
        title={cms?.title || "Contact us"}
        description={
          cms?.intro ||
          "Send a message and we will store it securely for review. Email notification depends on server configuration."
        }
      />
      {cms && cms.sections.length > 0 ? (
        <div className="mb-8">
          <PageSections sections={cms.sections} />
        </div>
      ) : null}
      <div className="mb-8 rounded-2xl border border-pb-border bg-pb-ivory px-5 py-4 text-sm text-pb-muted">
        <p>{siteConfig.contact.addressLines.join(", ")}</p>
        {siteConfig.contact.phones.map((phone) => (
          <p key={phone.href} className="mt-1">
            <a href={phone.href} className="hover:text-pb-pink">
              {phone.display}
            </a>
          </p>
        ))}
        <p className="mt-1">
          <a href={siteConfig.contact.emailHref} className="hover:text-pb-pink">
            {siteConfig.contact.email}
          </a>
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
