"use client";

import { useRouter } from "next/navigation";
import { IconGrid, IconList } from "@/components/icons";
import {
  buildFilterHref,
  type FilterState,
} from "@/lib/catalog-query";

const VIEW_KEY = "pb-shop-view";

export function ResultsToolbar({
  total,
  basePath,
  state,
}: {
  total: number;
  basePath: string;
  state: FilterState;
}) {
  const router = useRouter();

  function setSort(sort: string) {
    router.push(buildFilterHref(basePath, { ...state, sort }, true));
  }

  function setView(view: "grid" | "list") {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      // ignore
    }
    router.push(buildFilterHref(basePath, { ...state, view }, true));
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-pb-border pb-3">
      <p className="text-sm text-pb-muted">
        <span className="font-semibold text-pb-charcoal">{total}</span>{" "}
        product{total === 1 ? "" : "s"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-pb-muted">Sort</span>
          <select
            className="pb-input py-2 text-sm"
            value={state.sort || "featured"}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name-asc">Name: A–Z</option>
            <option value="name-desc">Name: Z–A</option>
          </select>
        </label>
        <div className="flex overflow-hidden rounded-full border border-pb-border" role="group" aria-label="Layout">
          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center ${
              state.view !== "list" ? "bg-pb-pink text-white" : "bg-white text-pb-charcoal"
            }`}
            aria-pressed={state.view !== "list"}
            aria-label="Grid view"
            onClick={() => setView("grid")}
          >
            <IconGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center ${
              state.view === "list" ? "bg-pb-pink text-white" : "bg-white text-pb-charcoal"
            }`}
            aria-pressed={state.view === "list"}
            aria-label="List view"
            onClick={() => setView("list")}
          >
            <IconList className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function readPreferredView(fallback: "grid" | "list" = "grid"): "grid" | "list" {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "list" ? "list" : "grid";
  } catch {
    return fallback;
  }
}
