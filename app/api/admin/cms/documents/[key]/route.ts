import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import {
  getDocument,
  getEditablePayload,
  saveDraft,
} from "@/lib/cms/documents";

type Props = { params: Promise<{ key: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { key } = await params;
  return withAdminApi(_req, "content", async () => {
    const doc = getDocument(decodeURIComponent(key));
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json({
      docKey: doc.docKey,
      title: doc.title,
      conflictToken: doc.conflictToken,
      draftRevision: doc.draftRevision,
      publishedRevision: doc.publishedRevision,
      payload: getEditablePayload(doc.docKey),
      hasDraft: doc.draft != null,
      publishedAt: doc.publishedAt,
    });
  }, { csrf: false });
}

export async function PUT(req: Request, { params }: Props) {
  const { key } = await params;
  return withAdminApi(req, "content", async (user) => {
    const body = (await req.json()) as {
      payload?: unknown;
      conflictToken?: string;
      title?: string;
    };
    if (!body.payload || !body.conflictToken) {
      return NextResponse.json({ error: "payload and conflictToken required" }, { status: 400 });
    }
    const updated = saveDraft({
      docKey: decodeURIComponent(key),
      payload: body.payload,
      conflictToken: body.conflictToken,
      actorId: user.id,
      title: body.title,
    });
    return NextResponse.json({
      ok: true,
      conflictToken: updated.conflictToken,
      draftRevision: updated.draftRevision,
    });
  });
}
