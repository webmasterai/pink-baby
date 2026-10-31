import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSessionUser } from "@/lib/auth/session";
import { can, isStaffRole, type AdminCapability } from "@/lib/cms/roles";
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
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login?next=/admin");
  }
  if (!isStaffRole(user.role)) {
    // Logged-in customers must not inherit admin access or get stuck on /account?next=/admin
    redirect("/admin/login?next=/admin&reason=staff_required");
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
