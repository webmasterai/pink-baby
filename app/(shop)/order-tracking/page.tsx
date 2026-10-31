import type { Metadata } from "next";
import { OrderTrackingForm } from "@/components/order-tracking/OrderTrackingForm";
import { resolveCmsPreview } from "@/lib/cms/preview";
import { getPageContent } from "@/lib/cms/site-content";

export const metadata: Metadata = {
  title: "Order tracking",
};

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrderTrackingPage({ searchParams }: PageProps) {
  const preview = await resolveCmsPreview((await searchParams)?.preview);
  const cms = getPageContent("order-tracking", { preview });

  return (
    <OrderTrackingForm
      title={cms?.title || undefined}
      description={cms?.intro || undefined}
    />
  );
}
