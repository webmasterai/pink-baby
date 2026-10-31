import { NextResponse } from "next/server";
import { AuthError, requireAdmin, type SessionUser } from "@/lib/auth/session";
import { assertCsrf, CsrfError } from "@/lib/csrf";
import {
  can,
  requireCapability,
  type AdminCapability,
} from "@/lib/cms/roles";
import { ensureCmsReady } from "@/lib/cms/runtime";
import { CmsConflictError } from "@/lib/cms/documents";

export async function withAdminApi(
  req: Request,
  capability: AdminCapability,
  handler: (user: SessionUser) => Promise<Response>,
  opts?: { csrf?: boolean },
) {
  try {
    ensureCmsReady();
    const user = await requireAdmin();
    requireCapability(user, capability);
    if (opts?.csrf !== false && req.method !== "GET" && req.method !== "HEAD") {
      await assertCsrf(req);
    }
    return await handler(user);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof CsrfError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof CmsConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const status = (err as { status?: number }).status;
    if (typeof status === "number") {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Request failed" },
        { status },
      );
    }
    console.error("[admin-api]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export function assertCan(user: SessionUser, capability: AdminCapability) {
  if (!can(user, capability)) {
    throw Object.assign(new Error("Insufficient permissions."), { status: 403 });
  }
}
