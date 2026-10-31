import { cache } from "react";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/cms/roles";

export const CMS_PREVIEW_COOKIE = "pb_cms_preview";

/** True only when preview is requested AND the viewer is signed-in staff. */
export const resolveCmsPreview = cache(
  async (previewParam?: string | string[]): Promise<boolean> => {
    const user = await getSessionUser();
    if (!user || !isStaffRole(user.role)) return false;

    const flag = Array.isArray(previewParam) ? previewParam[0] : previewParam;
    if (flag === "1" || flag === "true") return true;
    if (flag === "0" || flag === "false") return false;

    // Layout chrome and pages without searchParams can use the preview cookie
    // set by proxy when staff open any ?preview=1 URL.
    try {
      const jar = await cookies();
      return jar.get(CMS_PREVIEW_COOKIE)?.value === "1";
    } catch {
      return false;
    }
  },
);
