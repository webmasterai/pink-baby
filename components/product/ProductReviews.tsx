"use client";

import { type FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-fetch";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
};

export function ProductReviews({
  productId,
  compact = false,
}: {
  productId: string;
  compact?: boolean;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as { reviews: Review[] };
      if (!cancelled) setReviews(data.reviews || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const res = await apiFetch("/api/reviews", {
      method: "POST",
      json: {
        productId,
        authorName: String(form.get("authorName") || ""),
        rating: Number(form.get("rating") || 5),
        body: String(form.get("body") || ""),
      },
    });
    const data = (await res.json()) as { message?: string; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not submit review.");
      return;
    }
    setMessage(data.message || "Submitted for moderation.");
    e.currentTarget.reset();
    setFormOpen(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-pb-charcoal">
            {reviews.length === 0
              ? "No approved reviews yet"
              : `${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
            {avg != null ? (
              <span className="ml-2 text-pb-pink" aria-label={`${avg.toFixed(1)} average`}>
                {"★".repeat(Math.round(avg))}
                <span className="ml-1 text-sm font-medium text-pb-muted">
                  {avg.toFixed(1)}
                </span>
              </span>
            ) : null}
          </p>
          <p className="text-xs text-pb-muted">
            Only moderated reviews are shown. No ratings are invented.
          </p>
        </div>
        <button
          type="button"
          className="pb-btn pb-btn-outline text-sm"
          aria-expanded={formOpen}
          onClick={() => setFormOpen((v) => !v)}
        >
          {formOpen ? "Cancel" : "Write a review"}
        </button>
      </div>

      {reviews.length > 0 ? (
        <ul className={`mt-4 space-y-3 ${compact ? "max-h-80 overflow-y-auto" : ""}`}>
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-pb-border bg-white p-4">
              <p className="font-semibold">
                {r.authorName}{" "}
                <span className="text-pb-pink" aria-label={`${r.rating} out of 5`}>
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
              </p>
              <p className="mt-2 text-sm text-pb-muted">{r.body}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {formOpen ? (
        <form
          onSubmit={onSubmit}
          className="mt-4 max-w-xl space-y-3 rounded-2xl border border-pb-border bg-white p-5"
        >
          <label className="block text-sm font-semibold">
            Name
            <input className="pb-input mt-1" name="authorName" required minLength={2} />
          </label>
          <label className="block text-sm font-semibold">
            Rating
            <select className="pb-input mt-1" name="rating" defaultValue="5">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Review
            <textarea className="pb-input mt-1 min-h-24" name="body" required minLength={10} />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <button type="submit" className="pb-btn pb-btn-primary" disabled={busy}>
            {busy ? "Submitting…" : "Submit for moderation"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
