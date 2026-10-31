import {
  SESSION_COOKIE,
  clearSessionCookie,
  destroySession,
} from "@/lib/auth/session";
import { assertCsrf } from "@/lib/csrf";
import { handleRouteError, jsonOk } from "@/lib/api";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    await destroySession(token);
    await clearSessionCookie();
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
