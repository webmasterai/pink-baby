import { ensureCsrfCookie } from "@/lib/csrf";
import { jsonOk } from "@/lib/api";

export async function GET() {
  const token = await ensureCsrfCookie();
  return jsonOk({ csrfToken: token });
}
