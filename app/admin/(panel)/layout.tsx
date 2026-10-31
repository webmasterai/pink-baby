import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCmsSessionUser } from "@/lib/cms/cms-session";
import { can, type AdminCapability } from "@/lib/cms/roles";
import { ensureCmsReady } from "@/lib/cms/runtime";
const ALL_CAPS: AdminCapability[] = [
  "dashboard",
  "content",
  "products",
  "orders",
  "customers",
  "reviews",
  "enquiries",
  "subscribers",
  "media",
  "settings",
  "users",
  "audit",
  "backup",
];

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  ensureCmsReady();
  const user = await getCmsSessionUser();
  if (!user) {
    redirect("/admin/login?next=/admin");
  }

  const capabilities = ALL_CAPS.filter((c) => can(user, c));

  return (
    <AdminShell
      userName={user.name}
      userEmail={user.email}
      capabilities={capabilities}
    >
      {children}
    </AdminShell>
  );
}
