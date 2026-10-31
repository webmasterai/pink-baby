"use client";

import NextLink from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { CategoryNavData } from "@/lib/category-nav-data";

type Props = {
  data: CategoryNavData;
  activeSlug?: string | null;
  browseFilters?: boolean;
  className?: string;
};

export function CategoryNav({
  data,
  activeSlug,
  browseFilters = false,
  className = "",
}: Props) {
  return (
    <nav aria-label="Product categories" className={className}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pb-muted">
        Categories
      </p>
      <ul className="space-y-1 text-sm">
        <li>
          <NextLink
            href="/search"
            className={`block rounded-lg px-2 py-1.5 font-semibold ${
              !activeSlug || activeSlug === "all"
                ? "bg-pb-blush text-pb-pink"
                : "hover:bg-pb-ivory"
            }`}
          >
            All products
            <span className="ml-1 text-pb-muted">({data.total})</span>
          </NextLink>
        </li>
        {data.categories.map((cat) => {
          const active = activeSlug === cat.slug;
          return (
            <li key={cat.slug}>
              <NextLink
                href={cat.href}
                className={`block rounded-lg px-2 py-1.5 font-semibold ${
                  active ? "bg-pb-blush text-pb-pink" : "hover:bg-pb-ivory"
                }`}
              >
                {cat.name}
                <span className="ml-1 font-medium text-pb-muted">({cat.count})</span>
              </NextLink>
              {cat.children.length > 0 ? (
                <ul className="ml-3 mt-1 space-y-0.5 border-l border-pb-border pl-2">
                  {cat.children.map((child) => {
                    const childActive = activeSlug === child.slug;
                    return (
                      <li key={child.slug}>
                        <NextLink
                          href={child.href}
                          className={`block rounded-md px-2 py-1 ${
                            childActive
                              ? "font-semibold text-pb-pink"
                              : "text-pb-muted hover:text-pb-charcoal"
                          }`}
                        >
                          {child.name}
                          <span className="ml-1">({child.count})</span>
                        </NextLink>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
        <li>
          <NextLink
            href="/sale"
            className={`block rounded-lg px-2 py-1.5 font-semibold ${
              activeSlug === "sale"
                ? "bg-pb-blush text-pb-pink"
                : "text-pb-pink hover:bg-pb-ivory"
            }`}
          >
            Sale
            <span className="ml-1 font-medium text-pb-muted">({data.saleCount})</span>
          </NextLink>
        </li>
      </ul>

      {browseFilters ? (
        <form
          method="get"
          action="/search"
          className="mt-6 space-y-3 rounded-2xl border border-pb-border bg-white p-3"
          aria-label="Browse products"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-pb-muted">
            Browse products
          </p>
          <p className="text-xs text-pb-muted">
            Opens matching catalog results — does not change this product.
          </p>
          <label className="block text-xs font-semibold">
            Search
            <input
              className="pb-input mt-1 text-sm"
              type="search"
              name="q"
              placeholder="Name or SKU"
            />
          </label>
          <label className="block text-xs font-semibold">
            Category
            <select className="pb-input mt-1 text-sm" name="category" defaultValue="">
              <option value="">All</option>
              {data.categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
              {data.categories.flatMap((c) =>
                c.children.map((child) => (
                  <option key={child.slug} value={child.slug}>
                    {c.name} / {child.name}
                  </option>
                )),
              )}
            </select>
          </label>
          <label className="block text-xs font-semibold">
            Availability
            <select className="pb-input mt-1 text-sm" name="availability" defaultValue="">
              <option value="">Any</option>
              <option value="in-stock">In stock</option>
              <option value="out-of-stock">Out of stock</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold">
              Min Rs
              <input className="pb-input mt-1 text-sm" type="number" name="minPrice" min={0} />
            </label>
            <label className="block text-xs font-semibold">
              Max Rs
              <input className="pb-input mt-1 text-sm" type="number" name="maxPrice" min={0} />
            </label>
          </div>
          <button type="submit" className="pb-btn pb-btn-primary w-full text-sm">
            Apply
          </button>
        </form>
      ) : null}
    </nav>
  );
}

export function CategoryFilterDrawer({
  data,
  activeSlug,
  children,
}: {
  data: CategoryNavData;
  activeSlug?: string | null;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    panelRef.current
      ?.querySelector<HTMLElement>("button, a, input, select")
      ?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const clearHref =
    activeSlug && activeSlug !== "all" && activeSlug !== "sale"
      ? `/category/${activeSlug}`
      : activeSlug === "sale"
        ? "/sale"
        : "/search";

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
            aria-label="Close filters"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-y-0 left-0 flex h-[100dvh] w-[min(100%,22rem)] flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-pb-border px-4 py-3">
              <h2 id={titleId} className="font-display text-lg font-bold">
                Browse
              </h2>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-sm font-semibold"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CategoryNav data={data} activeSlug={activeSlug} browseFilters />
              {children}
            </div>
            <div className="flex gap-2 border-t border-pb-border p-3">
              <NextLink
                href={clearHref}
                className="pb-btn pb-btn-outline flex-1 text-sm"
                onClick={() => setOpen(false)}
              >
                Clear
              </NextLink>
              <button
                type="button"
                className="pb-btn pb-btn-primary flex-1 text-sm"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
