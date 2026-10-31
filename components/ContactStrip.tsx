import {
  getHeaderContent,
  getSiteContent,
  type HeaderCmsPayload,
} from "@/lib/cms/site-content";
import type { SiteCmsPayload } from "@/lib/cms/types";

export function ContactStrip({
  site: siteProp,
  header: headerProp,
}: {
  site?: SiteCmsPayload;
  header?: HeaderCmsPayload | null;
}) {
  const site = siteProp ?? getSiteContent();
  const header = headerProp === undefined ? getHeaderContent() : headerProp;
  const { whatsapp, call } = site.contact;

  const announcementVisible =
    header?.announcementVisible ?? site.announcementVisible;
  const announcementText = header?.announcement || site.announcement;

  return (
    <div className="bg-pb-logo-blue text-white">
      <div className="pb-container grid grid-cols-1 items-center gap-1 py-1.5 text-[0.8rem] sm:grid-cols-3 md:text-[0.85rem]">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-medium sm:justify-start">
          <a
            href={whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            WhatsApp: {whatsapp.display}
          </a>
          <a href={call.href} className="hover:underline">
            Call: {call.display}
          </a>
        </div>
        <p className="text-center font-medium tracking-wide">
          {announcementVisible ? announcementText : site.tagline}{" "}
          <span aria-hidden="true" className="text-white">
            ♥
          </span>
        </p>
        <a
          href={site.contact.emailHref}
          className="hidden text-right font-medium hover:underline sm:block"
        >
          {site.contact.email}
        </a>
      </div>
    </div>
  );
}
