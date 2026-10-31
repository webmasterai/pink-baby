import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { listMedia, saveUploadedMedia } from "@/lib/cms/media";

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "media",
    async () => {
      const url = new URL(req.url);
      return NextResponse.json({
        media: listMedia(url.searchParams.get("q") || undefined),
      });
    },
    { csrf: false },
  );
}

export async function POST(req: Request) {
  return withAdminApi(req, "media", async (user) => {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const asset = await saveUploadedMedia({
      bytes: buf,
      filename: file.name,
      mime: file.type || "application/octet-stream",
      alt: String(form.get("alt") || ""),
      actorId: user.id,
    });
    return NextResponse.json({ media: asset });
  });
}
