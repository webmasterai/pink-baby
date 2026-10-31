import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withAdminApi } from "@/lib/cms/admin-api";
import { writeAudit } from "@/lib/cms/audit";
import {
  SESSION_COOKIE,
  destroyOtherSessions,
} from "@/lib/auth/session";
import { assertPasswordStrength, hashPassword, verifyPassword } from "@/lib/auth/password";
import { getDb, nowIso } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(128),
  confirmPassword: z.string().min(10).max(128),
});

export async function PUT(req: Request) {
  return withAdminApi(req, "dashboard", async (user) => {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid password payload." }, { status: 400 });
    }
    const { currentPassword, newPassword, confirmPassword } = parsed.data;
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New password confirmation does not match." }, { status: 400 });
    }
    const strength = assertPasswordStrength(newPassword);
    if (strength) return NextResponse.json({ error: strength }, { status: 400 });

    const row = getDb()
      .prepare(`SELECT password_hash AS hash FROM users WHERE id = ?`)
      .get(user.id) as { hash: string } | undefined;
    if (!row || !(await verifyPassword(currentPassword, row.hash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    const nextHash = await hashPassword(newPassword);
    getDb()
      .prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`)
      .run(nextHash, nowIso(), user.id);

    const jar = await cookies();
    const keep = jar.get(SESSION_COOKIE)?.value;
    if (keep) destroyOtherSessions(user.id, keep);

    writeAudit({
      actorId: user.id,
      action: "profile.password_change",
      entityType: "user",
      entityId: user.id,
      meta: { otherSessionsInvalidated: true },
    });

    return NextResponse.json({ ok: true });
  });
}
