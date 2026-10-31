"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { inputClass } from "@/components/admin/StructuredDocForm";
import {
  btnPrimary,
  btnSecondary,
  btnSmall,
  formatDate,
  Loading,
  Notice,
  PageHead,
  tableWrap,
  tdClass,
  thClass,
  useAdminResource,
} from "@/components/admin/AdminUi";

type ProductSummary = {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  status: string;
  available: boolean;
  featured: boolean;
  primaryCategorySlug: string | null;
  price: number | null;
  image?: string;
  imageAlt?: string;
  updatedAt: string;
};

const PAGE_SIZE = 25;

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => setPage(1), [debounced, status, archived]);

  const params = new URLSearchParams();
  if (debounced) params.set("q", debounced);
  if (status) params.set("status", status);
  if (archived) params.set("archived", "1");
  const { data, error, loading } = useAdminResource<{ products: ProductSummary[] }>(
    `/api/admin/cms/products?${params.toString()}`,
  );
  const products = data?.products || [];
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [products, page]);

  return (
    <div className="space-y-5">
      <PageHead
        title="Products"
        description="Thumbnails, SKU, category, price, availability and publication status."
        actions={
          <Link href="/admin/products/new" className={btnPrimary}>
            + New product
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Search name, slug or SKU…"
          aria-label="Search products"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={`${inputClass} !w-40`}
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="accent-pink-500"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />
          Include archived
        </label>
        <span className="ml-auto text-xs text-slate-500">
          {products.length} products · page {page}/{totalPages}
        </span>
      </div>
      <Notice error={error} />
      {loading && !data ? (
        <Loading />
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[880px]">
            <thead>
              <tr>
                <th className={thClass}>Product</th>
                <th className={thClass}>SKU</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Price</th>
                <th className={thClass}>Availability</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Updated</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td className={tdClass} colSpan={8}>
                    No products found.
                  </td>
                </tr>
              ) : (
                pageItems.map((p) => (
                  <tr key={p.id}>
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image}
                              alt={p.imageAlt || p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="font-semibold hover:text-pb-pink"
                          >
                            {p.name}
                          </Link>
                          {p.featured ? (
                            <span className="ml-2 rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-pb-pink">
                              Featured
                            </span>
                          ) : null}
                          <div className="text-xs text-slate-400">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className={tdClass}>{p.sku || "—"}</td>
                    <td className={tdClass}>{p.primaryCategorySlug || "—"}</td>
                    <td className={tdClass}>
                      {p.price != null ? `Rs ${p.price.toLocaleString()}` : "—"}
                    </td>
                    <td className={tdClass}>
                      {p.available ? (
                        <span className="font-semibold text-emerald-700">In stock</span>
                      ) : (
                        <span className="font-semibold text-slate-500">Unavailable</span>
                      )}
                    </td>
                    <td className={tdClass}>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${
                          p.status === "published"
                            ? "bg-emerald-50 text-emerald-700"
                            : p.status === "draft"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className={tdClass}>{formatDate(p.updatedAt)}</td>
                    <td className={`${tdClass} text-right`}>
                      <Link href={`/admin/products/${p.id}`} className={`${btnSecondary} ${btnSmall}`}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            className={btnSecondary}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className={btnSecondary}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
