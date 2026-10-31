"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { CategoryNavData } from "@/lib/category-nav-data";
import {
  buildFilterHref,
  type FilterState,
} from "@/lib/catalog-query";

type Props = {
  data: CategoryNavData;
  basePath: string;
  state: FilterState;
  /** When set, category page is scoped; checkboxes refine within tree */
  lockedCategory?: string | null;
  className?: string;
  onApplied?: () => void;
};

function normalizePriceState(next: FilterState): FilterState {
  const min = next.minPrice ? Number(next.minPrice) : null;
  const max = next.maxPrice ? Number(next.maxPrice) : null;
  if (
    min != null &&
    max != null &&
    !Number.isNaN(min) &&
    !Number.isNaN(max) &&
    min > max
  ) {
    return { ...next, minPrice: String(max), maxPrice: String(min) };
  }
  return next;
}

function sameFilters(a: FilterState, b: FilterState) {
  return (
    a.q === b.q &&
    a.availability === b.availability &&
    a.onSale === b.onSale &&
    a.minPrice === b.minPrice &&
    a.maxPrice === b.maxPrice &&
    a.sort === b.sort &&
    a.view === b.view &&
    a.categories.length === b.categories.length &&
    a.categories.every((c) => b.categories.includes(c))
  );
}

export function FilterSidebar({
  data,
  basePath,
  state,
  lockedCategory,
  className = "",
  onApplied,
}: Props) {
  const router = useRouter();
  const [openRoots, setOpenRoots] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const cat of data.categories) {
      init[cat.slug] =
        state.categories.includes(cat.slug) ||
        cat.children.some((c) => state.categories.includes(c.slug)) ||
        lockedCategory === cat.slug ||
        cat.children.some((c) => c.slug === lockedCategory);
    }
    return init;
  });

  const [draft, setDraft] = useState(state);
  const draftRef = useRef(state);
  /** Price values last committed to the URL — ignore debounce when only syncing from props */
  const committedPrice = useRef({
    min: state.minPrice,
    max: state.maxPrice,
  });

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setDraft(state);
      draftRef.current = state;
      committedPrice.current = { min: state.minPrice, max: state.maxPrice };
    });
    return () => cancelAnimationFrame(id);
  }, [state]);

  function commit(next: FilterState, closeDrawer = false) {
    const normalized = normalizePriceState(next);
    setDraft(normalized);
    draftRef.current = normalized;
    committedPrice.current = {
      min: normalized.minPrice,
      max: normalized.maxPrice,
    };
    if (sameFilters(normalized, state)) {
      if (closeDrawer) onApplied?.();
      return;
    }
    router.push(buildFilterHref(basePath, normalized));
    if (closeDrawer) onApplied?.();
  }

  function toggleCat(slug: string) {
    const prev = draftRef.current;
    const has = prev.categories.includes(slug);
    commit({
      ...prev,
      categories: has
        ? prev.categories.filter((c) => c !== slug)
        : [...prev.categories, slug],
    });
  }

  // Debounce price typing so filters apply without an Apply click
  useEffect(() => {
    if (
      draft.minPrice === committedPrice.current.min &&
      draft.maxPrice === committedPrice.current.max
    ) {
      return;
    }
    const t = window.setTimeout(() => {
      commit(draftRef.current);
    }, 400);
    return () => window.clearTimeout(t);
    // Only react to price field edits; commit reads latest draft via ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.minPrice, draft.maxPrice]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    commit(draftRef.current, true);
  }

  const clearHref = lockedCategory
    ? basePath
    : buildFilterHref(basePath, {
        q: "",
        categories: [],
        availability: "",
        onSale: false,
        minPrice: "",
        maxPrice: "",
        sort: state.sort,
        view: state.view,
        page: 1,
      });

  const activeCount =
    draft.categories.length +
    (draft.availability ? 1 : 0) +
    (draft.onSale ? 1 : 0) +
    (draft.minPrice || draft.maxPrice ? 1 : 0) +
    (draft.q ? 1 : 0);

  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-2xl border border-pb-border bg-white p-4 ${className}`}
      aria-label="Product filters"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-bold text-pb-charcoal">Filters</h2>
        {activeCount > 0 ? (
          <span className="rounded-full bg-pb-blush px-2 py-0.5 text-xs font-bold text-pb-pink">
            {activeCount}
          </span>
        ) : null}
      </div>

      <p className="mb-3 text-[11px] leading-snug text-pb-muted">
        Counts include products in that category and its subcategories.
      </p>

      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-bold text-pb-charcoal">Categories</legend>
        <ul className="max-h-72 space-y-1 overflow-y-auto pr-1 text-sm">
          {!lockedCategory ? (
            <li>
              <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-1.5 hover:bg-pb-ivory/80">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.categories.length === 0}
                    onChange={() => commit({ ...draft, categories: [] })}
                  />
                  All products
                </span>
                <span className="text-pb-muted">{data.total}</span>
              </label>
            </li>
          ) : null}
          {data.categories.map((cat) => {
            const expanded = openRoots[cat.slug];
            const checked = draft.categories.includes(cat.slug);
            return (
              <li key={cat.slug}>
                <div className="flex items-center gap-1">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-1.5 hover:bg-pb-ivory/80">
                    <span className="flex min-w-0 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked || lockedCategory === cat.slug}
                        disabled={lockedCategory === cat.slug}
                        onChange={() => toggleCat(cat.slug)}
                      />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="shrink-0 text-pb-muted">{cat.count}</span>
                  </label>
                  {cat.children.length > 0 ? (
                    <button
                      type="button"
                      className="rounded px-1.5 py-1 text-xs font-bold text-pb-muted"
                      aria-expanded={expanded}
                      aria-label={`${expanded ? "Collapse" : "Expand"} ${cat.name}`}
                      onClick={() =>
                        setOpenRoots((o) => ({ ...o, [cat.slug]: !o[cat.slug] }))
                      }
                    >
                      {expanded ? "−" : "+"}
                    </button>
                  ) : null}
                </div>
                {cat.children.length > 0 ? (
                  <div
                    className={`pb-accordion-body ${expanded ? "is-open" : ""}`}
                    aria-hidden={!expanded}
                  >
                    <ul className="pb-accordion-inner ml-4 space-y-0.5 border-l border-pb-border pl-2">
                      {cat.children.map((child) => (
                        <li key={child.slug}>
                          <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-1 hover:bg-pb-ivory/80">
                            <span className="flex min-w-0 items-center gap-2">
                              <input
                                type="checkbox"
                                tabIndex={expanded ? 0 : -1}
                                checked={
                                  draft.categories.includes(child.slug) ||
                                  lockedCategory === child.slug
                                }
                                disabled={lockedCategory === child.slug}
                                onChange={() => toggleCat(child.slug)}
                              />
                              <span className="truncate text-[0.9rem]">{child.name}</span>
                            </span>
                            <span className="shrink-0 text-xs text-pb-muted">
                              {child.count}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
          <li>
            <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-1.5 hover:bg-pb-ivory/80">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.categories.includes("sale")}
                  onChange={() => toggleCat("sale")}
                />
                Sale category
              </span>
              <span className="text-pb-muted">{data.saleCount}</span>
            </label>
          </li>
        </ul>
      </fieldset>

      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-bold text-pb-charcoal">Price (Rs)</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-semibold text-pb-muted">
            Min
            <input
              type="number"
              min={0}
              className="pb-input mt-1 text-sm"
              value={draft.minPrice}
              onChange={(e) =>
                setDraft((p) => ({ ...p, minPrice: e.target.value }))
              }
              onBlur={() => commit(draftRef.current)}
            />
          </label>
          <label className="block text-xs font-semibold text-pb-muted">
            Max
            <input
              type="number"
              min={0}
              className="pb-input mt-1 text-sm"
              value={draft.maxPrice}
              onChange={(e) =>
                setDraft((p) => ({ ...p, maxPrice: e.target.value }))
              }
              onBlur={() => commit(draftRef.current)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-bold text-pb-charcoal">Availability</legend>
        <div className="space-y-1.5 text-sm">
          {(
            [
              ["", "Any"],
              ["in-stock", "In stock"],
              ["out-of-stock", "Out of stock"],
            ] as const
          ).map(([value, label]) => (
            <label key={label} className="flex items-center gap-2">
              <input
                type="radio"
                name="availability"
                checked={draft.availability === value}
                onChange={() => commit({ ...draft, availability: value })}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={draft.onSale}
          onChange={(e) => commit({ ...draft, onSale: e.target.checked })}
        />
        On sale
      </label>

      <Link
        href={clearHref}
        className="pb-btn pb-btn-outline w-full text-sm"
        onClick={onApplied}
      >
        Clear filters
      </Link>
    </form>
  );
}

export function ActiveFilterChips({
  state,
  basePath,
  nav,
}: {
  state: FilterState;
  basePath: string;
  nav: CategoryNavData;
}) {
  const chips: { key: string; label: string; href: string }[] = [];
  const nameFor = (slug: string) => {
    if (slug === "sale") return "Sale";
    for (const c of nav.categories) {
      if (c.slug === slug) return c.name;
      const child = c.children.find((x) => x.slug === slug);
      if (child) return child.name;
    }
    return slug;
  };

  if (state.q) {
    chips.push({
      key: "q",
      label: `Search: ${state.q}`,
      href: buildFilterHref(basePath, { ...state, q: "" }),
    });
  }
  for (const cat of state.categories) {
    chips.push({
      key: `cat-${cat}`,
      label: nameFor(cat),
      href: buildFilterHref(basePath, {
        ...state,
        categories: state.categories.filter((c) => c !== cat),
      }),
    });
  }
  if (state.availability) {
    chips.push({
      key: "availability",
      label: state.availability === "in-stock" ? "In stock" : "Out of stock",
      href: buildFilterHref(basePath, { ...state, availability: "" }),
    });
  }
  if (state.onSale) {
    chips.push({
      key: "onSale",
      label: "On sale",
      href: buildFilterHref(basePath, { ...state, onSale: false }),
    });
  }
  if (state.minPrice || state.maxPrice) {
    chips.push({
      key: "price",
      label: `Rs ${state.minPrice || "0"}–${state.maxPrice || "∞"}`,
      href: buildFilterHref(basePath, { ...state, minPrice: "", maxPrice: "" }),
    });
  }

  if (!chips.length) return null;

  return (
    <ul className="mb-4 flex flex-wrap gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <Link
            href={chip.href}
            className="inline-flex items-center gap-1 rounded-full border border-pb-border bg-white px-3 py-1 text-xs font-semibold text-pb-charcoal hover:border-pb-pink hover:text-pb-pink"
          >
            {chip.label}
            <span aria-hidden="true">×</span>
            <span className="sr-only">Remove {chip.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const FILTER_DRAWER_EXIT_MS = 360;

export function FilterDrawer({
  data,
  basePath,
  state,
  lockedCategory,
}: {
  data: CategoryNavData;
  basePath: string;
  state: FilterState;
  lockedCategory?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openClass, setOpenClass] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const activeCount = useMemo(
    () =>
      state.categories.length +
      (state.availability ? 1 : 0) +
      (state.onSale ? 1 : 0) +
      (state.minPrice || state.maxPrice ? 1 : 0) +
      (state.q ? 1 : 0),
    [state],
  );

  useEffect(() => {
    if (open) {
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        setMounted(true);
        raf2 = requestAnimationFrame(() => setOpenClass(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    const raf = requestAnimationFrame(() => setOpenClass(false));
    const t = window.setTimeout(() => setMounted(false), FILTER_DRAWER_EXIT_MS);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
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
        Filters{activeCount > 0 ? ` (${activeCount})` : ""}
      </button>
      {mounted ? (
        <div
          className={`pb-drawer-root fixed inset-0 z-50 ${openClass ? "is-open" : ""}`}
          aria-hidden={!openClass}
        >
          <button
            type="button"
            className="pb-drawer-backdrop absolute inset-0 bg-black/40"
            aria-label="Close filters"
            tabIndex={openClass ? 0 : -1}
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="pb-drawer-panel pb-drawer-panel-left absolute inset-y-0 left-0 flex h-[100dvh] w-[min(100%,20rem)] flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-pb-border px-4 py-3">
              <h2 id={titleId} className="font-display text-lg font-bold">
                Filters
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
              <FilterSidebar
                data={data}
                basePath={basePath}
                state={state}
                lockedCategory={lockedCategory}
                onApplied={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
