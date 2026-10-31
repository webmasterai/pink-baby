import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { getDb, nowIso } from "@/lib/db";
import { writeAudit } from "@/lib/cms/audit";

type Props = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Props) {
  const { id } = await params;
  return withAdminApi(req, "reviews", async (user) => {
    const body = (await req.json()) as { status?: string; notes?: string };
    if (!body.status || !["approved", "rejected", "pending"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const existing = getDb()
      .prepare(`SELECT id, notes FROM reviews WHERE id = ?`)
      .get(id) as { id: string; notes: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    getDb()
      .prepare(`UPDATE reviews SET status = ?, notes = ? WHERE id = ?`)
      .run(body.status, body.notes ?? existing.notes, id);
    writeAudit({
      actorId: user.id,
      action: "review.moderate",
      entityType: "review",
      entityId: id,
      meta: { status: body.status, at: nowIso() },
    });
    return NextResponse.json({ ok: true });
  });
}
