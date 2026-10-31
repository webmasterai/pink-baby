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

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "dashboard",
    async (user) => {
      const row = getDb()
        .prepare(
          `SELECT id, email, name, phone, role, created_at AS createdAt, updated_at AS updatedAt
           FROM users WHERE id = ?`,
        )
        .get(user.id);
      return NextResponse.json({ profile: row });
    },
    { csrf: false },
  );
}

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional().nullable(),
});

export async function PUT(req: Request) {
  return withAdminApi(req, "dashboard", async (user) => {
    const body = profileSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid profile fields." }, { status: 400 });
    }
    getDb()
      .prepare(`UPDATE users SET name = ?, phone = ?, updated_at = ? WHERE id = ?`)
      .run(body.data.name, body.data.phone || null, nowIso(), user.id);
    writeAudit({
      actorId: user.id,
      action: "profile.update",
      entityType: "user",
      entityId: user.id,
    });
    return NextResponse.json({ ok: true });
  });
}
