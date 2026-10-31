import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "users",
    async () => {
      const users = getDb()
        .prepare(
          `SELECT id, email, name, role, created_at AS createdAt
           FROM users
           WHERE role IN ('owner','admin','editor','order_manager')
           ORDER BY created_at ASC`,
        )
        .all();
      return NextResponse.json({ users });
    },
    { csrf: false },
  );
}
