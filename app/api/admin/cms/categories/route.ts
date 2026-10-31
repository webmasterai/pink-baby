import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import {
  listCmsCategories,
  productCountForCategory,
  saveCmsCategory,
} from "@/lib/cms/categories";

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "products",
    async () => {
      const categories = listCmsCategories().map((c) => ({
        ...c,
        count: productCountForCategory(c.slug),
      }));
      return NextResponse.json({ categories });
    },
    { csrf: false },
  );
}

export async function POST(req: Request) {
  return withAdminApi(req, "products", async (user) => {
    const body = await req.json();
    if (!body?.slug || !body?.name || !body?.displayName) {
      return NextResponse.json(
        { error: "slug, name, displayName required" },
        { status: 400 },
      );
    }
    const category = saveCmsCategory(body, user.id);
    return NextResponse.json({ category });
  });
}

export async function PUT(req: Request) {
  return withAdminApi(req, "products", async (user) => {
    const body = await req.json();
    if (!body?.slug || !body?.name || !body?.displayName) {
      return NextResponse.json(
        { error: "slug, name, displayName required" },
        { status: 400 },
      );
    }
    const category = saveCmsCategory(body, user.id);
    return NextResponse.json({ category });
  });
}
