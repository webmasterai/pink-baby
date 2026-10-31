import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/WishlistView";
import { PageHeader } from "@/components/ui/PageHeader";
import { findRichtext } from "@/lib/cms/page-sections";
import { resolveCmsPreview } from "@/lib/cms/preview";
import { getPageContent } from "@/lib/cms/site-content";

export const metadata: Metadata = {
  title: "Wishlist",
};

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WishlistPage({ searchParams }: PageProps) {
  const preview = await resolveCmsPreview((await searchParams)?.preview);
  const cms = getPageContent("wishlist", { preview });
  const states = getPageContent("empty-states", { preview });
  const empty = findRichtext(cms, "wishlist-empty") ?? findRichtext(states, "wishlist-empty");

  return (
    <div className="pb-container py-12 md:py-16">
      <PageHeader
        title={cms?.title || "Wishlist"}
        description={cms?.intro || "Saved product identifiers stay in this browser only."}
      />
      <WishlistView
        title={empty?.heading || undefined}
        description={empty?.body || undefined}
      />
    </div>
  );
}
