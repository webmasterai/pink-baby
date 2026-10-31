import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatPkr } from "@/content/catalog";
import { siteConfig } from "@/content/site";
import { trackOrder } from "@/lib/commerce/orders";

type Props = {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ token?: string }>;
};

export const metadata: Metadata = {
  title: "Order confirmation",
};

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { ref } = await params;
  const { token } = await searchParams;
  const reference = decodeURIComponent(ref).toUpperCase();

  const order = token ? trackOrder(reference, "", token) : null;

  if (!order) {
    return (
      <div className="pb-container py-12 md:py-16">
        <PageHeader
          title="Order received"
          description={`If you just placed order ${reference}, keep your confirmation link or track it with the email/phone used at checkout.`}
        />
        <div className="flex flex-wrap gap-3">
          <Link href="/order-tracking" className="pb-btn pb-btn-primary inline-flex">
            Track order
          </Link>
          <Link href="/" className="pb-btn pb-btn-outline inline-flex">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader
        title="Thank you"
        description={`Order ${order.reference} was recorded. This is not automatic payment confirmation unless a verified provider webhook marks it paid.`}
      />
      <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-pb-border bg-white p-6">
        <p>
          <span className="font-semibold">Status:</span> {order.status}
        </p>
        <p>
          <span className="font-semibold">Payment:</span> {order.paymentMethod} ·{" "}
          {order.paymentStatus}
        </p>
        <p>
          <span className="font-semibold">Total:</span> {formatPkr(order.totalPkr)}
        </p>
        <ul className="divide-y divide-pb-border text-sm">
          {order.items.map((item, i) => (
            <li key={`${item.productId}-${i}`} className="flex justify-between py-2">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>{formatPkr(item.lineTotalPkr)}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-pb-muted">
          Questions? WhatsApp{" "}
          <a href={siteConfig.contact.whatsapp.href} className="font-semibold text-pb-pink">
            {siteConfig.contact.whatsapp.display}
          </a>{" "}
          or call{" "}
          <a href={siteConfig.contact.call.href} className="font-semibold text-pb-pink">
            {siteConfig.contact.call.display}
          </a>
          .
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/order-tracking" className="pb-btn pb-btn-outline">
            Track order
          </Link>
          <Link href="/" className="pb-btn pb-btn-primary">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
