import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { getDb } from "@/lib/db";
import { writeAudit } from "@/lib/cms/audit";

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "reviews",
    async () => {
      const url = new URL(req.url);
      const status = url.searchParams.get("status");
      let sql = `SELECT id, product_id AS productId, author_name AS authorName,
                        rating, body, status, notes, created_at AS createdAt
                 FROM reviews`;
      const params: string[] = [];
      if (status) {
        sql += ` WHERE status = ?`;
        params.push(status);
      }
      sql += ` ORDER BY created_at DESC LIMIT 300`;
      const reviews = getDb().prepare(sql).all(...params);
      return NextResponse.json({ reviews });
    },
    { csrf: false },
  );
}
