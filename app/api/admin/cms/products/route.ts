import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { createCmsProduct, listCmsProducts } from "@/lib/cms/products";
import { productCountForCategory, listCmsCategories } from "@/lib/cms/categories";

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "products",
    async () => {
      const url = new URL(req.url);
      const q = url.searchParams.get("q") || undefined;
      const status = url.searchParams.get("status") || undefined;
      const products = listCmsProducts({
        includeArchived: url.searchParams.get("archived") === "1",
        q,
        status: status || undefined,
      });
      return NextResponse.json({
        products: products.map((p) => ({
          id: p.id,
          slug: p.slug,
          sku: p.sku,
          name: p.name,
          status: p.status,
          available: p.available,
          featured: p.featured,
          primaryCategorySlug: p.primaryCategorySlug,
          price: p.pricing?.price ?? null,
          image: p.image,
          imageAlt: p.imageAlt,
          updatedAt: p.updatedAt,
          stockVersion: p.stockVersion,
        })),
        categories: listCmsCategories().map((c) => ({
          slug: c.slug,
          name: c.displayName,
          count: productCountForCategory(c.slug),
        })),
      });
    },
    { csrf: false },
  );
}

export async function POST(req: Request) {
  return withAdminApi(req, "products", async (user) => {
    const body = await req.json();
    if (!body?.name || !body?.slug) {
      return NextResponse.json({ error: "name and slug required" }, { status: 400 });
    }
    const product = createCmsProduct(body, user.id);
    return NextResponse.json({ product });
  });
}
