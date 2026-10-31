import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { getDb } from "@/lib/db";
import { writeAudit } from "@/lib/cms/audit";

type Props = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Props) {
  const { id } = await params;
  return withAdminApi(req, "settings", async (user) => {
    getDb().prepare(`DELETE FROM redirects WHERE id = ?`).run(id);
    writeAudit({
      actorId: user.id,
      action: "redirect.delete",
      entityType: "redirect",
      entityId: id,
    });
    return NextResponse.json({ ok: true });
  });
}
