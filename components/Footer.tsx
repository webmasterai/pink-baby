import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import {
  IconEnvelope,
  IconFacebook,
  IconInstagram,
  IconMapPin,
  IconPhone,
  IconPinterest,
  IconYoutube,
} from "@/components/icons";
import { navLinks } from "@/content/categories";
import { siteConfig } from "@/content/site";
import { getFooterContent, getSiteContent } from "@/lib/cms/site-content";
import type { FooterCmsPayload, SiteCmsPayload } from "@/lib/cms/types";

const fallbackCareLinks = [
  { label: "My account", href: "/account" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Order Tracking", href: "/order-tracking" },
  { label: "Delivery", href: "/delivery" },
  { label: "Returns / Exchange", href: "/returns" },
  { label: "FAQ", href: "/faq" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;

export function Footer({
  site: siteProp,
  footer: footerProp,
}: {
  site?: SiteCmsPayload;
  footer?: FooterCmsPayload | null;
}) {
  const year = new Date().getFullYear();
  const site = siteProp ?? getSiteContent();
  const footer = footerProp === undefined ? getFooterContent() : footerProp;
  const blurb =
    footer?.blurb ||
    `${site.description} Soft, practical essentials for everyday moments with your little one.`;
  const columns =
    footer?.columns?.length && footer.columns.some((c) => c.links.length)
      ? footer.columns
      : [
          {
            title: "Shop",
            links: navLinks.map((l) => ({ label: l.name, href: l.href })),
          },
          {
            title: "Customer Care",
            links: fallbackCareLinks.map((l) => ({ label: l.label, href: l.href })),
          },
        ];
  const showContact = footer?.showContact !== false;
  const showSocial = footer?.showSocial !== false;
  const logoSrc = site.logos.primary || "/images/logo-wordmark.png";

  return (
    <footer className="border-t border-pb-border bg-white">
      {/*
        Desktop: brand | CMS link columns | contact on ONE row.
        Extra CMS columns share the middle flex area without forcing Contact down.
      */}
      <div className="pb-container flex flex-col gap-6 py-14 md:gap-7 md:py-16 xl:flex-row xl:items-start xl:gap-6">
        <div className="min-w-0 space-y-3 xl:w-[min(100%,17.5rem)] xl:shrink-0">
          <BrandLogo src={logoSrc} />
          <p className="max-w-sm text-sm leading-relaxed text-pb-muted xl:max-w-none">
            {blurb}
          </p>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 xl:grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))]">
          {columns.map((col) => (
            <div key={col.title} className="min-w-0">
              <h2 className="mb-2.5 font-display text-base font-bold leading-tight">
                {col.title}
              </h2>
              <ul className="space-y-1.5 text-sm text-pb-muted">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.href}-${link.label}`}>
                    <Link href={link.href} className="hover:text-pb-pink break-words">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {showContact ? (
          <div className="min-w-0 sm:max-w-sm xl:w-[min(100%,15.5rem)] xl:shrink-0">
            <h2 className="mb-2.5 font-display text-base font-bold leading-tight">
              Contact Us
            </h2>
            <ul className="space-y-2.5 text-sm text-pb-muted">
              <li className="flex gap-2">
                <IconMapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0 break-words">
                  {site.contact.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
              {site.contact.phones.map((phone) => (
                <li key={phone.href} className="flex gap-2">
                  <IconPhone className="mt-0.5 h-4 w-4 shrink-0" />
                  <a href={phone.href} className="min-w-0 break-all hover:text-pb-pink">
                    {phone.display}
                  </a>
                </li>
              ))}
              <li className="flex gap-2">
                <IconEnvelope className="mt-0.5 h-4 w-4 shrink-0" />
                <a
                  href={site.contact.emailHref}
                  className="min-w-0 break-all hover:text-pb-pink"
                >
                  {site.contact.email}
                </a>
              </li>
            </ul>
          </div>
        ) : null}
      </div>

      <div className="border-t border-pb-border">
        <div className="pb-container flex flex-col items-center justify-between gap-3 py-6 text-sm text-pb-muted sm:flex-row md:py-7">
          <p>
            © {year} {site.legalName || siteConfig.legalName}. All rights reserved.
          </p>
          {showSocial ? (
            <ul className="flex items-center gap-3">
              <li>
                <a
                  href={site.social.facebook}
                  aria-label="Facebook"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:text-pb-pink"
                >
                  <IconFacebook className="h-4 w-4" />
                </a>
              </li>
              <li>
                <a
                  href={site.social.instagram}
                  aria-label="Instagram"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:text-pb-pink"
                >
                  <IconInstagram className="h-4 w-4" />
                </a>
              </li>
              <li>
                <a
                  href={site.social.youtube}
                  aria-label="YouTube"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:text-pb-pink"
                >
                  <IconYoutube className="h-4 w-4" />
                </a>
              </li>
              <li>
                <a
                  href={site.social.pinterest}
                  aria-label="Pinterest"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:text-pb-pink"
                >
                  <IconPinterest className="h-4 w-4" />
                </a>
              </li>
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
