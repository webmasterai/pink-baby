import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/session";
import { CsrfError } from "@/lib/csrf";
import { OrderError } from "@/lib/commerce/orders";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleRouteError(err: unknown) {
  if (err instanceof CsrfError) return jsonError(err.message, err.status);
  if (err instanceof AuthError) return jsonError(err.message, err.status);
  if (err instanceof OrderError) return jsonError(err.message, err.status);
  console.error("[api]", err instanceof Error ? err.message : "unknown");
  return jsonError("Something went wrong.", 500);
}
