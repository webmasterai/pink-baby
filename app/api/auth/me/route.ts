import { getSessionUser } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  return jsonOk({ user });
}
