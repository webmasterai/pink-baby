import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { listEnquiries } from "@/lib/cms/enquiries";

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "enquiries",
    async () => {
      const url = new URL(req.url);
      const enquiries = listEnquiries({
        status: url.searchParams.get("status") || undefined,
        q: url.searchParams.get("q") || undefined,
      });
      return NextResponse.json({ enquiries });
    },
    { csrf: false },
  );
}
