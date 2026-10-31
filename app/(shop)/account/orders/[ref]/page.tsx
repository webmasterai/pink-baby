import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatPkr } from "@/content/catalog";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getOrderByReference } from "@/lib/commerce/orders";

type Props = { params: Promise<{ ref: string }> };

export const metadata: Metadata = { title: "Order details" };

export default async function AccountOrderDetailPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/account");

  const { ref } = await params;
  const reference = decodeURIComponent(ref).toUpperCase();
  const row = getDb()
    .prepare(`SELECT user_id AS userId, customer_email AS email FROM orders WHERE reference = ?`)
    .get(reference) as { userId: string | null; email: string } | undefined;

  if (!row) notFound();
  const owned =
    row.userId === user.id ||
    row.email.toLowerCase() === user.email.toLowerCase();
  if (!owned) notFound();

  const order = getOrderByReference(reference);
  if (!order) notFound();

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader title={order.reference} description={`Status: ${order.status}`} />
      <div className="max-w-2xl space-y-3 rounded-2xl border border-pb-border bg-white p-5 text-sm">
        <p>
          Payment: {order.paymentMethod} · {order.paymentStatus}
        </p>
        <p>Total: {formatPkr(order.totalPkr)}</p>
        <ul className="divide-y divide-pb-border">
          {order.items.map((item, i) => (
            <li key={`${item.productId}-${i}`} className="flex justify-between py-2">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>{formatPkr(item.lineTotalPkr)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
