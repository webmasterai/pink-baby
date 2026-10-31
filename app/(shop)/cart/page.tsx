import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { PageHeader } from "@/components/ui/PageHeader";
import { findRichtext } from "@/lib/cms/page-sections";
import { resolveCmsPreview } from "@/lib/cms/preview";
import { getPageContent } from "@/lib/cms/site-content";

export const metadata: Metadata = {
  title: "Cart",
};

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CartPage({ searchParams }: PageProps) {
  const preview = await resolveCmsPreview((await searchParams)?.preview);
  const cms = getPageContent("cart", { preview });
  const states = getPageContent("empty-states", { preview });
  const empty = findRichtext(cms, "cart-empty") ?? findRichtext(states, "cart-empty");

  return (
    <div className="pb-container py-12 md:py-16">
      <PageHeader
        title={cms?.title || "Your cart"}
        description={
          cms?.intro ||
          "Cart items are stored locally in this browser as product identifiers only."
        }
      />
      <CartView
        title={empty?.heading || undefined}
        description={empty?.body || undefined}
      />
    </div>
  );
}
