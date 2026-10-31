import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { createBackup, listBackups, restoreBackup } from "@/lib/cms/backup";

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "backup",
    async () => NextResponse.json({ backups: listBackups() }),
    { csrf: false },
  );
}

export async function POST(req: Request) {
  return withAdminApi(req, "backup", async (user) => {
    const body = (await req.json()) as { action?: string; name?: string };
    if (body.action === "create") {
      return NextResponse.json(createBackup(user.id));
    }
    if (body.action === "restore" && body.name) {
      return NextResponse.json(restoreBackup(body.name, user.id));
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  });
}
