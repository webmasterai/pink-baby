import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { listAudit } from "@/lib/cms/audit";

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "audit",
    async () => NextResponse.json({ entries: listAudit(200) }),
    { csrf: false },
  );
}
