import type { AdminCapability } from "@/lib/cms/roles";

export type AdminNavItem = {
  href: string;
  label: string;
  capability: AdminCapability;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", capability: "dashboard" },
  { href: "/admin/homepage", label: "Homepage", capability: "content" },
  { href: "/admin/pages", label: "Pages", capability: "content" },
  { href: "/admin/products", label: "Products", capability: "products" },
  { href: "/admin/categories", label: "Categories & Subcategories", capability: "products" },
  { href: "/admin/attributes", label: "Product Attributes & Variants", capability: "products" },
  { href: "/admin/orders", label: "Orders", capability: "orders" },
  { href: "/admin/customers", label: "Customers", capability: "customers" },
  { href: "/admin/reviews", label: "Reviews", capability: "reviews" },
  { href: "/admin/enquiries", label: "Enquiries", capability: "enquiries" },
  { href: "/admin/subscribers", label: "Newsletter Subscribers", capability: "subscribers" },
  { href: "/admin/media", label: "Media Library", capability: "media" },
  { href: "/admin/navigation", label: "Navigation", capability: "content" },
  { href: "/admin/header", label: "Header & Announcement Bar", capability: "content" },
  { href: "/admin/footer", label: "Footer", capability: "content" },
  { href: "/admin/contact", label: "Contact & Social Links", capability: "settings" },
  { href: "/admin/shipping", label: "Shipping & Payment Settings", capability: "settings" },
  { href: "/admin/seo", label: "SEO & Redirects", capability: "settings" },
  { href: "/admin/users", label: "Admin Users / Roles", capability: "users" },
  { href: "/admin/profile", label: "My Profile & Security", capability: "dashboard" },
  { href: "/admin/audit", label: "Audit History", capability: "audit" },
  { href: "/admin/backup", label: "Backup & Restore", capability: "backup" },
];
