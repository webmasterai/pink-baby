import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { listSubscribers } from "@/lib/cms/enquiries";

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "subscribers",
    async () => {
      const url = new URL(req.url);
      const subscribers = listSubscribers({
        q: url.searchParams.get("q") || undefined,
        status: url.searchParams.get("status") || undefined,
      });
      return NextResponse.json({ subscribers });
    },
    { csrf: false },
  );
}
