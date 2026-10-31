import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatPkr } from "@/content/catalog";
import { getSessionUser } from "@/lib/auth/session";
import { listOrdersForUser } from "@/lib/commerce/orders";

export const metadata: Metadata = { title: "Order history" };

export default async function AccountOrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/account");
  const orders = listOrdersForUser(user.id);

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader title="Order history" description="Only your orders are listed here." />
      {orders.length === 0 ? (
        <p className="text-sm text-pb-muted">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-pb-border rounded-2xl border border-pb-border bg-white">
          {orders.map((o) => (
            <li key={o.reference} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <Link href={`/account/orders/${o.reference}`} className="font-semibold text-pb-pink">
                  {o.reference}
                </Link>
                <p className="text-sm text-pb-muted">
                  {o.status} · {o.paymentStatus} ·{" "}
                  {new Date(o.createdAt).toLocaleString("en-PK")}
                </p>
              </div>
              <p className="font-bold">{formatPkr(o.totalPkr)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
