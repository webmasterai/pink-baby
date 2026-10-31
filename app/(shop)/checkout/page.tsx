import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSessionUser } from "@/lib/auth/session";
import { firstRichtext } from "@/lib/cms/page-sections";
import { resolveCmsPreview } from "@/lib/cms/preview";
import { getPageContent } from "@/lib/cms/site-content";
import {
  getConfiguredShippingPkr,
  getEnabledPaymentMethods,
} from "@/lib/commerce/settings";

export const metadata: Metadata = {
  title: "Checkout",
};

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CheckoutPage({ searchParams }: PageProps) {
  const preview = await resolveCmsPreview((await searchParams)?.preview);
  const cms = getPageContent("checkout", { preview });
  const help = firstRichtext(cms);
  const user = await getSessionUser();
  const methods = getEnabledPaymentMethods().map((m) => ({
    id: m.id,
    label: m.label,
    description: m.description,
  }));
  const shipping = getConfiguredShippingPkr();

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader
        title={cms?.title || "Checkout"}
        description={
          cms?.intro ||
          "Guest checkout is available. Card and bank options appear only when configured."
        }
      />
      {help ? (
        <p className="mx-auto -mt-4 mb-8 max-w-2xl text-center text-sm text-pb-muted">
          {help.body}
        </p>
      ) : null}
      <CheckoutForm
        paymentMethods={methods}
        shippingConfigured={shipping != null}
        shippingPkr={shipping}
        prefill={{
          fullName: user?.name,
          email: user?.email,
          phone: user?.phone || undefined,
        }}
      />
    </div>
  );
}
