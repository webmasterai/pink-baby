import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetailsTabs } from "@/components/product/ProductDetailsTabs";
import { ProductGallery } from "@/components/product/ProductGallery";
import {
  ProductSidebar,
  ProductSidebarDrawer,
} from "@/components/product/ProductSidebar";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Reveal, Stagger } from "@/components/ui/Reveal";
import { formatPkr, getAllCatalogProducts } from "@/content/catalog";
import { getCategoryBySlug } from "@/content/categories";
import { getAllProducts, getProductBySlug } from "@/content/products";
import { getCategoryNavData } from "@/lib/category-nav-data";
import { relatedProducts } from "@/lib/catalog-query";
import { displaySku, parseProductDescription } from "@/lib/product-content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllCatalogProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.name,
    description: product.shortDescription || product.description.slice(0, 160),
    alternates: { canonical: `/product/${product.slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategoryBySlug(product.categorySlug);
  const nav = getCategoryNavData();
  const priceLabel = formatPkr(product.pricing?.price ?? null);
  const regularLabel =
    product.pricing?.onSale && product.pricing.regularPrice != null
      ? formatPkr(product.pricing.regularPrice)
      : null;
  const sku = displaySku(product.sku, product.name);
  const parsed = parseProductDescription(product.description);
  const related = relatedProducts(product, getAllProducts(), 4);

  const crumbs = [
    { label: "Home", href: "/" },
    ...(category
      ? [{ label: category.name, href: category.href }]
      : [{ label: "Shop", href: "/search" }]),
    { label: product.name },
  ];

  return (
    <div className="pb-container py-8 md:py-10">
      <Breadcrumbs items={crumbs} />
      <ProductSidebarDrawer data={nav} activeSlug={product.categorySlug} />

      <div className="grid gap-8 lg:grid-cols-[minmax(240px,260px)_minmax(0,1fr)] lg:gap-8 xl:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <ProductSidebar data={nav} activeSlug={product.categorySlug} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-8 xl:gap-10">
            <ProductGallery
              images={
                product.images.length
                  ? product.images
                  : [{ src: product.image, alt: product.imageAlt }]
              }
              name={product.name}
            />

            <div>
              {category ? (
                <Link
                  href={category.href}
                  className="text-sm font-semibold text-pb-pink hover:text-pb-pink-dark"
                >
                  {category.name}
                </Link>
              ) : null}
              <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-pb-charcoal md:text-3xl">
                {product.name}
              </h1>
              {sku ? (
                <p className="mt-2 text-sm text-pb-muted">SKU: {sku}</p>
              ) : null}

              <div className="mt-4">
                {priceLabel ? (
                  <p className="text-2xl font-bold text-pb-charcoal">
                    {regularLabel ? (
                      <span className="mr-3 text-base font-medium text-pb-muted line-through">
                        {regularLabel}
                      </span>
                    ) : null}
                    {priceLabel}
                    {product.pricing?.onSale ? (
                      <span className="ml-2 rounded-full bg-pb-blush px-2 py-0.5 text-xs font-semibold text-pb-pink">
                        Sale
                      </span>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-pb-muted">Price unavailable from source catalog</p>
                )}
              </div>

              {!product.available ? (
                <p className="mt-3 rounded-xl bg-pb-blush px-4 py-2 text-sm font-semibold text-pb-charcoal">
                  Currently out of stock
                </p>
              ) : (
                <p className="mt-3 text-sm font-semibold text-emerald-700">In stock</p>
              )}

              <div className="mt-6">
                <ProductActions
                  productId={product.id}
                  productName={product.name}
                  productSlug={product.slug}
                  sku={sku}
                  available={product.available}
                  unitPrice={product.pricing?.price ?? null}
                  attributes={product.attributes
                    .filter((a) => a.terms.length > 0)
                    .map((a) => ({ name: a.name, terms: a.terms }))}
                />
              </div>
            </div>
          </div>

          <ProductDetailsTabs
            blocks={parsed.blocks}
            specs={parsed.specs}
            productId={product.id}
          />

          {related.length > 0 ? (
            <section className="mt-12">
              <Reveal>
                <h2 className="pb-heading-reveal font-display text-2xl font-bold">
                  Related products
                </h2>
              </Reveal>
              <Stagger
                className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4"
                maxStagger={8}
                stepMs={55}
              >
                {related.map((p) => (
                  <div key={p.id}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </Stagger>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
