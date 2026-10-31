import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { deleteMedia, updateMediaAlt } from "@/lib/cms/media";

type Props = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Props) {
  const { id } = await params;
  return withAdminApi(req, "media", async (user) => {
    const body = (await req.json()) as { alt?: string };
    updateMediaAlt(id, body.alt || "", user.id);
    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(req: Request, { params }: Props) {
  const { id } = await params;
  return withAdminApi(req, "media", async (user) => {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    deleteMedia(id, user.id, force);
    return NextResponse.json({ ok: true });
  });
}
