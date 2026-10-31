import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { updateEnquiry } from "@/lib/cms/enquiries";
import { writeAudit } from "@/lib/cms/audit";
import type { EnquiryRecord } from "@/lib/cms/types";

type Props = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Props) {
  const { id } = await params;
  return withAdminApi(req, "enquiries", async (user) => {
    const body = (await req.json()) as {
      status?: EnquiryRecord["status"];
      notes?: string;
    };
    updateEnquiry(id, body);
    writeAudit({
      actorId: user.id,
      action: "enquiry.update",
      entityType: "enquiry",
      entityId: id,
      meta: { status: body.status },
    });
    return NextResponse.json({ ok: true });
  });
}
