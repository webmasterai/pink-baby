import Link from "next/link";
import { getDashboardStats } from "@/lib/cms/dashboard";

export default function AdminDashboardPage() {
  const stats = getDashboardStats();

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {stats.cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {card.label}
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Recent enquiries</h2>
            <Link href="/admin/enquiries" className="text-sm font-semibold text-pb-pink">
              View all
            </Link>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2 font-semibold">Name</th>
                <th className="pb-2 font-semibold">Type</th>
                <th className="pb-2 font-semibold">Subject</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-slate-500">
                    No enquiries yet.
                  </td>
                </tr>
              ) : (
                stats.recentEnquiries.map((e, i) => (
                  <tr key={`${e.name}-${i}`} className="border-t border-slate-100">
                    <td className="py-2.5 font-medium">{e.name}</td>
                    <td className="py-2.5 text-slate-500">{e.type}</td>
                    <td className="py-2.5 text-slate-600">{e.subject}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Recent products</h2>
            <Link href="/admin/products" className="text-sm font-semibold text-pb-pink">
              View all
            </Link>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2 font-semibold">Product</th>
                <th className="pb-2 font-semibold">Category</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentProducts.map((p) => (
                <tr key={p.name} className="border-t border-slate-100">
                  <td className="py-2.5 font-medium">{p.name}</td>
                  <td className="py-2.5 text-slate-500">{p.category}</td>
                  <td className="py-2.5">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-display text-base font-bold">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            ["/admin/products/new", "+ Add Product"],
            ["/admin/pages", "Edit Pages"],
            ["/admin/homepage", "Edit Homepage"],
            ["/admin/media", "Manage Media"],
            ["/", "View Website"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold hover:border-pb-pink hover:text-pb-pink"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
