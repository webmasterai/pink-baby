import type { Metadata } from "next";
import { PageSections } from "@/components/cms/PageSections";
import { getPageContent } from "@/lib/cms/site-content";
import { resolveCmsPreview } from "@/lib/cms/preview";
import { PageHeader } from "@/components/ui/PageHeader";
import { siteConfig } from "@/content/site";
import { getConfiguredShippingPkr } from "@/lib/commerce/settings";
import { formatPkr } from "@/content/catalog";

export const metadata: Metadata = { title: "Delivery information" };

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function DeliveryPage({ searchParams }: PageProps) {
  const preview = await resolveCmsPreview((await searchParams)?.preview);
  const shipping = getConfiguredShippingPkr();
  const cms = getPageContent("delivery", { preview });

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader
        title={cms?.title || "Delivery information"}
        description={
          cms?.intro || "Verified public contact details only — shipping rates are not invented."
        }
      />
      {cms && cms.sections.length > 0 ? (
        <div className="mb-6">
          <PageSections sections={cms.sections} />
        </div>
      ) : null}
      <div className="mx-auto max-w-3xl space-y-4 text-sm leading-relaxed text-pb-muted md:text-base">
        {cms && cms.sections.length > 0 ? null : (
          <p>
            Pink Baby aims to bring baby essentials closer to families across Pakistan. Exact courier
            partners and timelines are confirmed when an order is accepted.
          </p>
        )}
        <p>
          Configured flat shipping for this deployment:{" "}
          {shipping != null ? (
            <strong className="text-pb-charcoal">{formatPkr(shipping)}</strong>
          ) : (
            <strong className="text-pb-charcoal">not set (SHIPPING_FLAT_PKR)</strong>
          )}
          . Until a rate is configured, checkout records shipping as “to be confirmed”.
        </p>
        <p>
          For delivery questions: WhatsApp{" "}
          <a href={siteConfig.contact.whatsapp.href} className="font-semibold text-pb-pink">
            {siteConfig.contact.whatsapp.display}
          </a>{" "}
          or call{" "}
          <a href={siteConfig.contact.call.href} className="font-semibold text-pb-pink">
            {siteConfig.contact.call.display}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
