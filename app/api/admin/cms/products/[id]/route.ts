import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import {
  archiveCmsProduct,
  getCmsProductById,
  updateCmsProduct,
} from "@/lib/cms/products";

type Props = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Props) {
  const { id } = await params;
  return withAdminApi(
    req,
    "products",
    async () => {
      const product = getCmsProductById(id);
      if (!product) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ product });
    },
    { csrf: false },
  );
}

export async function PUT(req: Request, { params }: Props) {
  const { id } = await params;
  return withAdminApi(req, "products", async (user) => {
    const body = await req.json();
    const product = updateCmsProduct(id, body, user.id, {
      expectedStockVersion: body.expectedStockVersion,
    });
    return NextResponse.json({ product });
  });
}

export async function DELETE(req: Request, { params }: Props) {
  const { id } = await params;
  return withAdminApi(req, "products", async (user) => {
    const product = archiveCmsProduct(id, user.id);
    return NextResponse.json({ product });
  });
}
