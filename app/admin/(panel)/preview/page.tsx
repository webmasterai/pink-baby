import { Card, PageHead } from "@/components/admin/AdminUi";

const LINKS = [
  { href: "/?preview=1", label: "Homepage" },
  { href: "/about?preview=1", label: "About" },
  { href: "/contact?preview=1", label: "Contact" },
  { href: "/delivery?preview=1", label: "Delivery" },
  { href: "/faq?preview=1", label: "FAQ" },
];

export default function AdminPreviewPage() {
  return (
    <div className="space-y-5">
      <PageHead title="Preview" description="See unpublished draft changes on the storefront." />
      <Card title="How preview works">
        <p className="text-sm text-slate-600">
          While you are signed in as staff, add <code className="rounded bg-slate-100 px-1">?preview=1</code>{" "}
          to any storefront URL to see the <strong>draft</strong> version of CMS content instead of
          the published one. Visitors who are not signed in as staff always see published content
          only, even with the parameter.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Save your draft in the editor, check it here, then press <strong>Publish</strong> to make it
          live.
        </p>
      </Card>
      <Card title="Open preview">
        <div className="flex flex-wrap gap-2">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-pb-pink px-3 py-2 text-sm font-semibold text-white"
            >
              {l.label}
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
