import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { getDb, nowIso } from "@/lib/db";
import { writeAudit } from "@/lib/cms/audit";

type Props = { params: Promise<{ id: string }> };

const ROLES = new Set(["owner", "admin", "editor", "order_manager", "customer"]);

export async function PUT(req: Request, { params }: Props) {
  const { id } = await params;
  return withAdminApi(req, "users", async (user) => {
    const body = (await req.json()) as { role?: string };
    if (!body.role || !ROLES.has(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (id === user.id && body.role === "customer") {
      return NextResponse.json(
        { error: "Cannot demote your own account." },
        { status: 400 },
      );
    }
    // Only owners may change roles (admins can view the list but not escalate privileges).
    if (user.role !== "owner") {
      return NextResponse.json(
        { error: "Only an owner can change user roles." },
        { status: 403 },
      );
    }
    const db = getDb();
    const target = db.prepare(`SELECT role FROM users WHERE id = ?`).get(id) as
      | { role: string }
      | undefined;
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (target.role === "owner" && body.role !== "owner") {
      const { c } = db
        .prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'owner'`)
        .get() as { c: number };
      if (c <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last owner." },
          { status: 400 },
        );
      }
    }
    db.prepare(`UPDATE users SET role = ?, updated_at = ? WHERE id = ?`).run(
      body.role,
      nowIso(),
      id,
    );
    writeAudit({
      actorId: user.id,
      action: "user.role_change",
      entityType: "user",
      entityId: id,
      meta: { role: body.role },
    });
    return NextResponse.json({ ok: true });
  });
}
