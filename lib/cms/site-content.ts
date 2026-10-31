import { siteConfig } from "@/content/site";
import { normalizeHomePayload } from "@/lib/cms/home-normalize";
import { getPublishedPayload, getEditablePayload } from "@/lib/cms/documents";
import { ensureCmsReady } from "@/lib/cms/runtime";
import type {
  FooterCmsPayload,
  HomeCmsPayload,
  NavCmsPayload,
  PageCmsPayload,
  SiteCmsPayload,
} from "@/lib/cms/types";

function isStaticBuild() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function ready() {
  if (isStaticBuild()) return;
  try {
    ensureCmsReady();
  } catch {
    // fall back to static content
  }
}

function fallbackSite(): SiteCmsPayload {
  return {
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    tagline: siteConfig.tagline,
    description: siteConfig.description,
    announcement: siteConfig.announcement,
    announcementVisible: true,
    logos: { primary: "/images/logo.png", favicon: "/images/favicon-32.png" },
    contact: {
      addressLines: [...siteConfig.contact.addressLines],
      whatsapp: { ...siteConfig.contact.whatsapp },
      call: { ...siteConfig.contact.call },
      phones: siteConfig.contact.phones.map((p) => ({ ...p })),
      email: siteConfig.contact.email,
      emailHref: siteConfig.contact.emailHref,
    },
    social: { ...siteConfig.social },
  };
}

export function getSiteContent(opts?: { preview?: boolean }): SiteCmsPayload {
  if (isStaticBuild() && !opts?.preview) return fallbackSite();
  ready();
  try {
    const fromCms = opts?.preview
      ? getEditablePayload<SiteCmsPayload>("site")
      : getPublishedPayload<SiteCmsPayload>("site");
    if (fromCms) return fromCms;
  } catch {
    // locked DB during parallel workers, etc.
  }
  return fallbackSite();
}

export { normalizeHomePayload } from "@/lib/cms/home-normalize";

function fallbackHome(): HomeCmsPayload {
  return normalizeHomePayload({});
}

export function getHomeContent(opts?: { preview?: boolean }): HomeCmsPayload {
  if (isStaticBuild() && !opts?.preview) return fallbackHome();
  ready();
  try {
    const fromCms = opts?.preview
      ? getEditablePayload<HomeCmsPayload>("home")
      : getPublishedPayload<HomeCmsPayload>("home");
    if (fromCms) return normalizeHomePayload(fromCms);
  } catch {
    // ignore
  }
  return fallbackHome();
}
export function getNavContent(opts?: { preview?: boolean }): NavCmsPayload | null {
  if (isStaticBuild() && !opts?.preview) return null;
  ready();
  try {
    return opts?.preview
      ? getEditablePayload<NavCmsPayload>("nav")
      : getPublishedPayload<NavCmsPayload>("nav");
  } catch {
    return null;
  }
}

export function getFooterContent(opts?: { preview?: boolean }): FooterCmsPayload | null {
  if (isStaticBuild() && !opts?.preview) return null;
  ready();
  try {
    return opts?.preview
      ? getEditablePayload<FooterCmsPayload>("footer")
      : getPublishedPayload<FooterCmsPayload>("footer");
  } catch {
    return null;
  }
}

export type HeaderCmsPayload = {
  announcement: string;
  announcementVisible: boolean;
  showSearch: boolean;
  showWishlist: boolean;
  showAccount: boolean;
};

export function getHeaderContent(opts?: { preview?: boolean }): HeaderCmsPayload | null {
  if (isStaticBuild() && !opts?.preview) return null;
  ready();
  try {
    return opts?.preview
      ? getEditablePayload<HeaderCmsPayload>("header")
      : getPublishedPayload<HeaderCmsPayload>("header");
  } catch {
    return null;
  }
}

export function getPageContent(
  key: string,
  opts?: { preview?: boolean },
): PageCmsPayload | null {
  if (isStaticBuild() && !opts?.preview) return null;
  ready();
  const docKey = key.startsWith("page:") ? key : `page:${key}`;
  try {
    return opts?.preview
      ? getEditablePayload<PageCmsPayload>(docKey)
      : getPublishedPayload<PageCmsPayload>(docKey);
  } catch {
    return null;
  }
}
