"use client";

import { useState } from "react";
import { inputClass } from "@/components/admin/StructuredDocForm";
import {
  btnDanger,
  btnPrimary,
  btnSmall,
  Card,
  formatDate,
  Loading,
  Notice,
  PageHead,
  readJson,
  useAdminResource,
} from "@/components/admin/AdminUi";
import { apiFetch } from "@/lib/client-fetch";

type Review = {
  id: string;
  productName?: string;
  productId?: string;
  productSlug?: string;
  author?: string;
  name?: string;
  email?: string;
  rating?: number;
  title?: string;
  body?: string;
  comment?: string;
  status: string;
  createdAt?: string;
};

const FILTERS = ["pending", "approved", "rejected", "all"] as const;

export default function AdminReviewsPage() {
  const { data, error, loading, missing, reload } = useAdminResource<{ reviews?: Review[] }>(
    "/api/admin/cms/reviews",
  );
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reviews = (data?.reviews || []).filter((r) => filter === "all" || r.status === filter);

  async function moderate(r: Review, status: "approved" | "rejected") {
    setErr(null);
    setMsg(null);
    setBusyId(r.id);
    try {
      const res = await apiFetch(`/api/admin/cms/reviews/${encodeURIComponent(r.id)}`, {
        method: "PUT",
        json: { status },
      });
      const d = await readJson(res);
      if (!res.ok) throw new Error(d.error || "Update failed");
      setMsg(`Review ${status}.`);
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHead title="Reviews" description="Approve or reject customer reviews before they appear." />
      <select
        className={`${inputClass} !w-44`}
        aria-label="Filter reviews"
        value={filter}
        onChange={(e) => setFilter(e.target.value as (typeof FILTERS)[number])}
      >
        {FILTERS.map((f) => (
          <option key={f} value={f}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </option>
        ))}
      </select>
      <Notice error={err || error} ok={msg} />
      {missing ? <Notice info="The reviews API (/api/admin/cms/reviews) is not available yet." /> : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <div className="space-y-3">
          {reviews.length === 0 ? <p className="text-sm text-slate-500">No reviews to show.</p> : null}
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    {"★".repeat(Math.max(0, Math.min(5, r.rating ?? 0)))}
                    <span className="text-slate-300">
                      {"★".repeat(5 - Math.max(0, Math.min(5, r.rating ?? 0)))}
                    </span>{" "}
                    {r.title}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                    {r.body || r.comment || "—"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {r.author || r.name || "Anonymous"}
                    {r.email ? ` · ${r.email}` : ""}
                    {r.productName || r.productSlug || r.productId
                      ? ` · ${r.productName || r.productSlug || r.productId}`
                      : ""}
                    {" · "}
                    {formatDate(r.createdAt)} ·{" "}
                    <span className="font-semibold capitalize">{r.status}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`${btnPrimary} ${btnSmall}`}
                    disabled={busyId === r.id || r.status === "approved"}
                    onClick={() => void moderate(r, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className={`${btnDanger} ${btnSmall}`}
                    disabled={busyId === r.id || r.status === "rejected"}
                    onClick={() => void moderate(r, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
