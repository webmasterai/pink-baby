import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";

/**
 * CMS password lives in CMS_ADMIN_PASSWORD_HASH (bcrypt), not SQLite.
 * Operators rotate it via `npm run cms:hash-password` + Coolify env update.
 */
export async function PUT(req: Request) {
  return withAdminApi(req, "dashboard", async () => {
    return NextResponse.json(
      {
        error:
          "CMS password is managed via CMS_ADMIN_PASSWORD_HASH. Generate a new hash with `npm run cms:hash-password` and update the server environment.",
      },
      { status: 400 },
    );
  });
}
