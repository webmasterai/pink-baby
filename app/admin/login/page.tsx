import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getCmsSessionUser } from "@/lib/cms/cms-session";
import { safeAdminReturnPath } from "@/lib/cms/safe-return";

export const metadata = {
  title: "Admin sign in | Pink Baby",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ next?: string; reason?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeAdminReturnPath(sp.next);
  const user = await getCmsSessionUser();

  // Already authorized CMS session → dashboard (or safe next)
  if (user) {
    redirect(next);
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
