import Link from "next/link";
import { Card, PageHead } from "@/components/admin/AdminUi";

const PAGES: { key: string; label: string; description: string }[] = [
  { key: "about", label: "About", description: "Brand story page" },
  { key: "contact", label: "Contact", description: "Contact page intro and copy" },
  { key: "delivery", label: "Delivery", description: "Shipping & delivery information" },
  { key: "returns", label: "Returns", description: "Returns & refunds policy" },
  { key: "faq", label: "FAQ", description: "Frequently asked questions" },
  { key: "privacy", label: "Privacy policy", description: "Privacy policy" },
  { key: "terms", label: "Terms & conditions", description: "Terms of service" },
  { key: "cart", label: "Cart", description: "Cart page copy" },
  { key: "checkout", label: "Checkout", description: "Checkout page copy" },
  { key: "account", label: "Account", description: "Account / login page copy" },
  { key: "wishlist", label: "Wishlist", description: "Wishlist page and empty-state copy" },
  { key: "order-tracking", label: "Order tracking", description: "Order tracking page copy" },
  { key: "empty-states", label: "Empty states", description: "Empty cart, wishlist and search messages" },
];

export default function AdminPagesIndex() {
  return (
    <div className="space-y-5">
      <PageHead title="Pages" description="Edit the content of static storefront pages." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PAGES.map((p) => (
          <Link key={p.key} href={`/admin/pages/${p.key}`} className="block">
            <Card>
              <p className="text-sm font-bold text-slate-900">{p.label}</p>
              <p className="mt-1 text-xs text-slate-500">{p.description}</p>
              <p className="mt-3 text-sm font-semibold text-pb-pink">Edit →</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
