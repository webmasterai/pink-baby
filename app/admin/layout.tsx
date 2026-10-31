export const metadata = {
  title: "Pink Baby Admin",
  robots: { index: false, follow: false },
};

/** Admin area is session-sensitive — never prerender. */
export const dynamic = "force-dynamic";

/**
 * Shared admin chrome-free shell (no storefront header/footer).
 * Auth for the CMS panel lives in `admin/(panel)/layout.tsx`.
 * `/admin/login` stays outside that group so customers can reach a real login form.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#f3f4f6] text-slate-900 antialiased">
      {children}
    </div>
  );
}
