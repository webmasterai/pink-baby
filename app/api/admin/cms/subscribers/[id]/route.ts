import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { setSubscriberStatus } from "@/lib/cms/enquiries";
import { writeAudit } from "@/lib/cms/audit";

type Props = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Props) {
  const { id } = await params;
  return withAdminApi(req, "subscribers", async (user) => {
    const body = (await req.json()) as { status?: "subscribed" | "unsubscribed" };
    if (!body.status) {
      return NextResponse.json({ error: "status required" }, { status: 400 });
    }
    setSubscriberStatus(id, body.status);
    writeAudit({
      actorId: user.id,
      action: "subscriber.update",
      entityType: "subscriber",
      entityId: id,
      meta: { status: body.status },
    });
    return NextResponse.json({ ok: true });
  });
}
