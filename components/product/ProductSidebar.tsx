"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { CategoryNavData } from "@/lib/category-nav-data";

type Props = {
  data: CategoryNavData;
  activeSlug?: string | null;
  className?: string;
};

function rowClass(active: boolean) {
  return [
    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pb-pink",
    active
      ? "bg-pb-blush font-semibold text-pb-pink"
      : "font-medium text-pb-charcoal hover:bg-pb-ivory",
  ].join(" ");
}

export function ProductSidebar({ data, activeSlug, className = "" }: Props) {
  const feeding = data.categories.find((c) => c.slug === "feeding-bottles");
  const [feedingOpen, setFeedingOpen] = useState(() => {
    if (!activeSlug) return true;
    if (activeSlug === "feeding-bottles") return true;
    return Boolean(feeding?.children.some((c) => c.slug === activeSlug));
  });

  function onFindSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const q = String(form.get("q") || "").trim();
    const minPrice = String(form.get("minPrice") || "").trim();
    const maxPrice = String(form.get("maxPrice") || "").trim();
    const availability = String(form.get("availability") || "").trim();
    const category = String(form.get("preserveCategory") || "").trim();

    if (q) params.set("q", q);
    if (category) params.set("cats", category);
    if (availability) params.set("availability", availability);

    const minN = minPrice === "" ? null : Number(minPrice);
    const maxN = maxPrice === "" ? null : Number(maxPrice);
    let minOut = minN;
    let maxOut = maxN;
    if (minOut != null && maxOut != null && !Number.isNaN(minOut) && !Number.isNaN(maxOut) && minOut > maxOut) {
      const t = minOut;
      minOut = maxOut;
      maxOut = t;
    }
    if (minOut != null && Number.isFinite(minOut) && minOut >= 0) {
      params.set("minPrice", String(Math.round(minOut)));
    }
    if (maxOut != null && Number.isFinite(maxOut) && maxOut >= 0) {
      params.set("maxPrice", String(Math.round(maxOut)));
    }

    const qs = params.toString();
    window.location.href = qs ? `/search?${qs}` : "/search";
  }

  return (
    <aside
      className={`rounded-[14px] border border-pb-border bg-white p-[18px] md:p-5 ${className}`}
      aria-label="Shop by category"
    >
      <h2 className="font-display text-base font-bold text-pb-charcoal">
        Shop by category
      </h2>

      <nav className="mt-3" aria-label="Categories">
        <ul className="space-y-0.5">
          <li>
            <Link href="/search" className={rowClass(!activeSlug || activeSlug === "all")}>
              <span>All products</span>
              <span className="tabular-nums text-pb-muted">{data.total}</span>
            </Link>
          </li>

          {data.categories.map((cat) => {
            const active = activeSlug === cat.slug;
            const hasChildren = cat.children.length > 0;
            const isFeeding = cat.slug === "feeding-bottles";

            return (
              <li key={cat.slug}>
                <div className="flex items-center gap-0.5">
                  <Link href={cat.href} className={`${rowClass(active)} min-w-0 flex-1`}>
                    <span className="truncate">{cat.name}</span>
                    <span className="shrink-0 tabular-nums text-pb-muted">{cat.count}</span>
                  </Link>
                  {hasChildren && isFeeding ? (
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-pb-muted hover:bg-pb-ivory hover:text-pb-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pb-pink"
                      aria-expanded={feedingOpen}
                      aria-controls="pdp-feeding-subcats"
                      aria-label={feedingOpen ? "Collapse Feeding Bottles" : "Expand Feeding Bottles"}
                      onClick={() => setFeedingOpen((v) => !v)}
                    >
                      <span
                        aria-hidden="true"
                        className={`text-xs transition ${feedingOpen ? "rotate-180" : ""}`}
                      >
                        ▾
                      </span>
                    </button>
                  ) : null}
                </div>

                {hasChildren && isFeeding && feedingOpen ? (
                  <ul
                    id="pdp-feeding-subcats"
                    className="ml-3 mt-0.5 space-y-0.5 border-l border-pb-border pl-2"
                  >
                    {cat.children.map((child) => {
                      const childActive = activeSlug === child.slug;
                      return (
                        <li key={child.slug}>
                          <Link
                            href={child.href}
                            className={rowClass(childActive)}
                          >
                            <span className="truncate">{child.name}</span>
                            <span className="shrink-0 tabular-nums text-pb-muted">
                              {child.count}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                {/* Non-feeding categories with children: always show lightly if present */}
                {hasChildren && !isFeeding ? (
                  <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-pb-border pl-2">
                    {cat.children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={child.href}
                          className={rowClass(activeSlug === child.slug)}
                        >
                          <span className="truncate">{child.name}</span>
                          <span className="shrink-0 tabular-nums text-pb-muted">
                            {child.count}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}

          <li>
            <Link href="/sale" className={rowClass(activeSlug === "sale")}>
              <span>Sale</span>
              <span className="shrink-0 tabular-nums text-pb-muted">{data.saleCount}</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="my-4 border-t border-pb-border" />

      <form onSubmit={onFindSubmit} aria-label="Find products" className="space-y-3">
        <h3 className="font-display text-sm font-bold text-pb-charcoal">Find products</h3>
        {activeSlug && activeSlug !== "all" ? (
          <input type="hidden" name="preserveCategory" value={activeSlug} />
        ) : null}

        <label className="block text-xs font-semibold text-pb-muted">
          Search by name or SKU
          <input
            className="pb-input mt-1 text-sm"
            type="search"
            name="q"
            placeholder="Name or SKU"
            autoComplete="off"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-semibold text-pb-muted">
            Min Rs
            <input
              className="pb-input mt-1 text-sm"
              type="number"
              name="minPrice"
              min={0}
              inputMode="numeric"
            />
          </label>
          <label className="block text-xs font-semibold text-pb-muted">
            Max Rs
            <input
              className="pb-input mt-1 text-sm"
              type="number"
              name="maxPrice"
              min={0}
              inputMode="numeric"
            />
          </label>
        </div>

        <label className="block text-xs font-semibold text-pb-muted">
          Availability
          <select className="pb-input mt-1 text-sm" name="availability" defaultValue="">
            <option value="">Any</option>
            <option value="in-stock">In stock</option>
            <option value="out-of-stock">Out of stock</option>
          </select>
        </label>

        <button type="submit" className="pb-btn pb-btn-primary w-full text-sm">
          Show products
        </button>
        <div className="text-center">
          <Link href="/search" className="text-xs font-semibold text-pb-pink hover:underline">
            Clear
          </Link>
        </div>
      </form>
    </aside>
  );
}

export function ProductSidebarDrawer({
  data,
  activeSlug,
}: {
  data: CategoryNavData;
  activeSlug?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current
      ?.querySelector<HTMLElement>("button, a, input, select")
      ?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="pb-btn pb-btn-outline mb-4 w-full"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Categories & filters
      </button>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close categories and filters"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-y-0 left-0 flex h-[100dvh] w-[min(100%,20rem)] flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-pb-border px-4 py-3">
              <h2 id={titleId} className="font-display text-lg font-bold">
                Categories & filters
              </h2>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-sm font-semibold"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <ProductSidebar data={data} activeSlug={activeSlug} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
