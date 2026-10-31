import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { resolveUploadAbsolute } from "@/lib/cms/media";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

type Props = { params: Promise<{ path: string[] }> };

export async function GET(_req: Request, { params }: Props) {
  const parts = (await params).path || [];
  const publicPath = `/uploads/${parts.join("/")}`;
  const abs = resolveUploadAbsolute(publicPath);
  if (!abs || !fs.existsSync(abs)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const buf = fs.readFileSync(abs);
  const ext = path.extname(abs).toLowerCase();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
