import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm, LogoutButton, RegisterForm } from "@/components/account/AuthForms";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatPkr } from "@/content/catalog";
import { getSessionUser } from "@/lib/auth/session";
import { resolveCmsPreview } from "@/lib/cms/preview";
import { getPageContent } from "@/lib/cms/site-content";
import { listOrdersForUser } from "@/lib/commerce/orders";

export const metadata: Metadata = {
  title: "Account",
};

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AccountPage({ searchParams }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    const preview = await resolveCmsPreview((await searchParams)?.preview);
    const cms = getPageContent("account", { preview });
    return (
      <div className="pb-container py-10 md:py-12">
        <PageHeader
          title={cms?.title || "My account"}
          description={
            cms?.intro ||
            "Register or sign in. Passwords are hashed server-side — this is not a fake login."
          }
        />
        <div className="grid gap-6 md:grid-cols-2">
          <LoginForm />
          <RegisterForm />
        </div>
      </div>
    );
  }

  const orders = listOrdersForUser(user.id);

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader
        title={`Hello, ${user.name}`}
        description={user.email}
      />
      <div className="mb-8 flex flex-wrap gap-3">
        <Link href="/account/orders" className="pb-btn pb-btn-outline">
          Order history
        </Link>
        <Link href="/account/addresses" className="pb-btn pb-btn-outline">
          Addresses
        </Link>
        {user.role === "admin" ||
        user.role === "owner" ||
        user.role === "editor" ||
        user.role === "order_manager" ? (
          <Link href="/admin" className="pb-btn pb-btn-outline">
            Admin CMS
          </Link>
        ) : (
          <Link href="/admin/login" className="text-sm font-semibold text-pb-pink hover:underline">
            Staff CMS login
          </Link>
        )}
        <LogoutButton />
      </div>

      <section className="rounded-2xl border border-pb-border bg-white p-5">
        <h2 className="font-display text-xl font-bold">Recent orders</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-pb-muted">No orders yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-pb-border">
            {orders.slice(0, 5).map((o) => (
              <li key={o.reference} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <Link
                    href={`/account/orders/${o.reference}`}
                    className="font-semibold text-pb-pink"
                  >
                    {o.reference}
                  </Link>
                  <p className="text-pb-muted">
                    {o.status} · {new Date(o.createdAt).toLocaleDateString("en-PK")}
                  </p>
                </div>
                <p className="font-bold">{formatPkr(o.totalPkr)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
