import type { Metadata } from "next";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid, ShopLayout } from "@/components/shop/ShopLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getProductsByCategory } from "@/content/products";
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
  title: "Sale",
  description: "Pink Baby products currently marked on sale.",
};

export default async function SalePage({ searchParams }: Props) {
  const sp = await searchParams;
  const state = filterStateFromSearchParams(sp);
  const nav = getCategoryNavData();
  const basePath = "/sale";
  const page = filterSortPaginate(getProductsByCategory("sale"), {
    q: state.q,
    categories: state.categories.filter((c) => c !== "sale"),
    availability: state.availability,
    onSale: false,
    minPrice: state.minPrice ? Number(state.minPrice) : null,
    maxPrice: state.maxPrice ? Number(state.maxPrice) : null,
    sort: state.sort as "featured",
    page: state.page,
    pageSize: 24,
  });

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader
        title="Sale"
        description="Products currently classified on sale in the public catalog."
      />
      <ShopLayout
        nav={nav}
        basePath={basePath}
        state={{ ...state, page: page.page }}
        total={page.total}
        totalPages={page.totalPages}
        lockedCategory="sale"
        makePageHref={(p) =>
          buildFilterHref(basePath, { ...state, page: p }, false)
        }
      >
        {page.total === 0 ? (
          <EmptyState
            title="No sale items match"
            description="Clear filters or browse the full catalog."
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
