import { Children, isValidElement, type ReactNode } from "react";
import {
  ActiveFilterChips,
  FilterDrawer,
  FilterSidebar,
} from "@/components/shop/FilterSidebar";
import { ResultsToolbar } from "@/components/shop/ResultsToolbar";
import { Pagination } from "@/components/shop/CatalogToolbar";
import { Stagger } from "@/components/ui/Reveal";
import type { CategoryNavData } from "@/lib/category-nav-data";
import type { FilterState } from "@/lib/catalog-query";

export function ShopLayout({
  nav,
  basePath,
  state,
  total,
  totalPages,
  makePageHref,
  lockedCategory,
  children,
}: {
  nav: CategoryNavData;
  basePath: string;
  state: FilterState;
  total: number;
  totalPages: number;
  makePageHref: (page: number) => string;
  lockedCategory?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-8">
      <aside className="hidden lg:block">
        <div className="sticky top-4">
          <FilterSidebar
            data={nav}
            basePath={basePath}
            state={state}
            lockedCategory={lockedCategory}
          />
        </div>
      </aside>
      <div className="min-w-0">
        <FilterDrawer
          data={nav}
          basePath={basePath}
          state={state}
          lockedCategory={lockedCategory}
        />
        <ActiveFilterChips state={state} basePath={basePath} nav={nav} />
        <ResultsToolbar total={total} basePath={basePath} state={state} />
        {children}
        <Pagination page={state.page} totalPages={totalPages} makeHref={makePageHref} />
      </div>
    </div>
  );
}

export function ProductGrid({
  view,
  children,
}: {
  view: "grid" | "list";
  children: ReactNode;
}) {
  const items = Children.map(children, (child) =>
    isValidElement(child) ? <div key={child.key}>{child}</div> : child,
  );

  if (view === "list") {
    return (
      <Stagger className="flex flex-col gap-3" maxStagger={8} stepMs={50}>
        {items}
      </Stagger>
    );
  }
  return (
    <Stagger
      className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 md:gap-5"
      maxStagger={8}
      stepMs={55}
    >
      {items}
    </Stagger>
  );
}
