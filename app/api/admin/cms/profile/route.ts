import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { writeAudit } from "@/lib/cms/audit";
import { getCmsEnvAuthConfig } from "@/lib/cms/env-auth";
import { z } from "zod";

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "dashboard",
    async (user) => {
      const config = getCmsEnvAuthConfig();
      return NextResponse.json({
        profile: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          authSource: "environment",
          username: config?.username ?? null,
        },
      });
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
    // Env CMS admin identity is not stored in SQLite — display name is session-only.
    writeAudit({
      actorId: user.id,
      action: "profile.update_ignored",
      entityType: "user",
      entityId: user.id,
      meta: { reason: "cms_env_auth" },
    });
    return NextResponse.json({
      ok: true,
      warning:
        "CMS admin identity comes from environment variables. Update CMS_ADMIN_USERNAME on the server to change the login name.",
    });
  });
}
