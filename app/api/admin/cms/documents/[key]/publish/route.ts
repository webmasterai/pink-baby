import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { publishDocument } from "@/lib/cms/documents";

type Props = { params: Promise<{ key: string }> };

export async function POST(req: Request, { params }: Props) {
  const { key } = await params;
  return withAdminApi(req, "content", async (user) => {
    const body = (await req.json()) as { conflictToken?: string };
    if (!body.conflictToken) {
      return NextResponse.json({ error: "conflictToken required" }, { status: 400 });
    }
    const updated = publishDocument({
      docKey: decodeURIComponent(key),
      conflictToken: body.conflictToken,
      actorId: user.id,
    });
    return NextResponse.json({
      ok: true,
      conflictToken: updated.conflictToken,
      publishedRevision: updated.publishedRevision,
      publishedAt: updated.publishedAt,
    });
  });
}
