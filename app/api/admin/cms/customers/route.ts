import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "customers",
    async () => {
      const customers = getDb()
        .prepare(
          `SELECT id, email, name, phone, created_at AS createdAt,
                  (SELECT COUNT(*) FROM orders o WHERE o.user_id = users.id) AS orderCount
           FROM users
           WHERE role = 'customer'
           ORDER BY created_at DESC
           LIMIT 500`,
        )
        .all();
      return NextResponse.json({ customers });
    },
    { csrf: false },
  );
}
