import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid, ShopLayout } from "@/components/shop/ShopLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getAllCategoriesFlat,
  getCategoryBySlug,
  getChildCategories,
} from "@/content/categories";
import { getProductsByCategory } from "@/content/products";
import { getCategoryNavData } from "@/lib/category-nav-data";
import {
  buildFilterHref,
  filterSortPaginate,
  filterStateFromSearchParams,
} from "@/lib/catalog-query";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return getAllCategoriesFlat().map((c) => {
    if (c.parentSlug) return { slug: [c.parentSlug, c.slug] };
    return { slug: [c.slug] };
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const current = slug[slug.length - 1];
  const category = getCategoryBySlug(current || "");
  if (!category) return { title: "Category" };
  return {
    title: category.name,
    description: category.description,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  if (!slug?.length) notFound();

  const currentSlug = slug[slug.length - 1]!;
  const category = getCategoryBySlug(currentSlug);
  if (!category) notFound();

  if (slug.length > 1) {
    const parent = getCategoryBySlug(slug[0]!);
    if (!parent || category.parentSlug !== parent.slug) notFound();
  }

  const children = getChildCategories(currentSlug);
  const basePath = category.href;
  const nav = getCategoryNavData();
  const state = filterStateFromSearchParams(sp);

  // Scope to this category; extra cats in URL refine further with AND via intersection
  const scoped = getProductsByCategory(currentSlug);
  const refineCats = state.categories.filter((c) => c !== currentSlug);
  const page = filterSortPaginate(scoped, {
    q: state.q,
    categories: refineCats,
    availability: state.availability,
    onSale: state.onSale,
    minPrice: state.minPrice ? Number(state.minPrice) : null,
    maxPrice: state.maxPrice ? Number(state.maxPrice) : null,
    sort: state.sort as "featured",
    page: state.page,
    pageSize: 24,
  });

  const crumbs = [
    { label: "Home", href: "/" },
    ...(slug.length > 1
      ? [
          {
            label: getCategoryBySlug(slug[0]!)?.name || slug[0]!,
            href: `/category/${slug[0]}`,
          },
        ]
      : []),
    { label: category.name },
  ];

  return (
    <div className="pb-container py-10 md:py-12">
      <Breadcrumbs items={crumbs} />
      <PageHeader title={category.name} description={category.description} />

      {children.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {children.map((child) => (
            <Link
              key={child.slug}
              href={child.href}
              className="rounded-full border border-pb-border bg-white px-4 py-2 text-sm font-semibold text-pb-charcoal hover:border-pb-pink hover:text-pb-pink"
            >
              {child.displayName}
            </Link>
          ))}
        </div>
      ) : null}

      <ShopLayout
        nav={nav}
        basePath={basePath}
        state={{ ...state, page: page.page }}
        total={page.total}
        totalPages={page.totalPages}
        lockedCategory={currentSlug}
        makePageHref={(p) =>
          buildFilterHref(basePath, { ...state, page: p }, false)
        }
      >
        {page.total === 0 ? (
          <EmptyState
            title="No products match"
            description="Try clearing filters or browse a related category."
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
