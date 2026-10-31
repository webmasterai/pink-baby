import type { Metadata } from "next";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid, ShopLayout } from "@/components/shop/ShopLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAllProducts } from "@/content/products";
import { getCategoryNavData } from "@/lib/category-nav-data";
import {
  buildFilterHref,
  filterSortPaginate,
  filterStateFromSearchParams,
} from "@/lib/catalog-query";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const state = filterStateFromSearchParams(sp);
  const nav = getCategoryNavData();
  const page = filterSortPaginate(getAllProducts(), {
    q: state.q,
    categories: state.categories,
    availability: state.availability,
    onSale: state.onSale,
    minPrice: state.minPrice ? Number(state.minPrice) : null,
    maxPrice: state.maxPrice ? Number(state.maxPrice) : null,
    sort: state.sort as "featured",
    page: state.page,
    pageSize: 24,
  });

  const basePath = "/search";

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader
        title="Shop"
        description={
          state.q
            ? `Results for “${state.q}”`
            : "Browse feeding and care essentials by category, price, and availability."
        }
      />

      <ShopLayout
        nav={nav}
        basePath={basePath}
        state={{ ...state, page: page.page }}
        total={page.total}
        totalPages={page.totalPages}
        makePageHref={(p) =>
          buildFilterHref(basePath, { ...state, page: p }, false)
        }
      >
        {page.total === 0 ? (
          <EmptyState
            title="No products found"
            description="Try clearing filters or a shorter keyword."
            actionHref={basePath}
            actionLabel="Clear filters"
          />
        ) : (
          <ProductGrid view={state.view}>
            {page.items.map((product) => (
              <ProductCard key={product.id} product={product} layout={state.view} />
            ))}
          </ProductGrid>
        )}
      </ShopLayout>
    </div>
  );
}
