import { clearCmsSessionCookie } from "@/lib/cms/cms-session";
import { assertCsrf } from "@/lib/csrf";
import { handleRouteError, jsonOk } from "@/lib/api";

/** Clears the CMS session cookie only — storefront customer sessions stay intact. */
export async function POST(request: Request) {
  try {
    await assertCsrf(request);
    await clearCmsSessionCookie();
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
