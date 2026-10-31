import { NextResponse } from "next/server";
import { withAdminApi } from "@/lib/cms/admin-api";
import { getDb, newId, nowIso } from "@/lib/db";
import { writeAudit } from "@/lib/cms/audit";

function normalizePath(p: string) {
  const s = p.trim();
  if (!s.startsWith("/")) return `/${s}`;
  return s.split("?")[0] || "/";
}

function wouldLoop(from: string, to: string): boolean {
  if (from === to) return true;
  const db = getDb();
  let current = to;
  const seen = new Set<string>([from]);
  for (let i = 0; i < 20; i++) {
    if (seen.has(current)) return true;
    seen.add(current);
    const row = db
      .prepare(`SELECT to_path AS toPath FROM redirects WHERE from_path = ?`)
      .get(current) as { toPath: string } | undefined;
    if (!row) return false;
    current = row.toPath;
  }
  return true;
}

export async function GET(req: Request) {
  return withAdminApi(
    req,
    "settings",
    async () => {
      const redirects = getDb()
        .prepare(
          `SELECT id, from_path AS fromPath, to_path AS toPath, status_code AS statusCode,
                  created_at AS createdAt
           FROM redirects ORDER BY created_at DESC`,
        )
        .all();
      return NextResponse.json({ redirects });
    },
    { csrf: false },
  );
}

export async function POST(req: Request) {
  return withAdminApi(req, "settings", async (user) => {
    const body = (await req.json()) as {
      fromPath?: string;
      toPath?: string;
      statusCode?: number;
    };
    if (!body.fromPath || !body.toPath) {
      return NextResponse.json({ error: "fromPath and toPath required" }, { status: 400 });
    }
    const fromPath = normalizePath(body.fromPath);
    const toPath = normalizePath(body.toPath);
    if (wouldLoop(fromPath, toPath)) {
      return NextResponse.json({ error: "Redirect would create a loop." }, { status: 400 });
    }
    const id = newId("redir");
    getDb()
      .prepare(
        `INSERT INTO redirects (id, from_path, to_path, status_code, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, fromPath, toPath, body.statusCode === 302 ? 302 : 301, nowIso());
    writeAudit({
      actorId: user.id,
      action: "redirect.create",
      entityType: "redirect",
      entityId: id,
    });
    return NextResponse.json({ ok: true, id });
  });
}
