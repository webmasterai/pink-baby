import type { SessionUser } from "@/lib/auth/session";
import type { CmsRole } from "@/lib/cms/types";

export type AdminCapability =
  | "dashboard"
  | "content"
  | "products"
  | "orders"
  | "customers"
  | "reviews"
  | "enquiries"
  | "subscribers"
  | "media"
  | "settings"
  | "users"
  | "audit"
  | "backup";

const ROLE_CAPS: Record<Exclude<CmsRole, "customer">, AdminCapability[]> = {
  owner: [
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
  ],
  admin: [
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
  ],
  editor: [
    "dashboard",
    "content",
    "products",
    "reviews",
    "enquiries",
    "subscribers",
    "media",
  ],
  order_manager: ["dashboard", "orders", "customers", "enquiries"],
};

export function normalizeRole(role: string): CmsRole {
  if (
    role === "owner" ||
    role === "admin" ||
    role === "editor" ||
    role === "order_manager"
  ) {
    return role;
  }
  return "customer";
}

export function isStaffRole(role: string): boolean {
  const r = normalizeRole(role);
  return r !== "customer";
}

export function can(user: SessionUser | null, capability: AdminCapability): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  if (role === "customer") return false;
  return ROLE_CAPS[role].includes(capability);
}

export function requireCapability(
  user: SessionUser,
  capability: AdminCapability,
): void {
  if (!can(user, capability)) {
    const err = new Error("Insufficient permissions.");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}
