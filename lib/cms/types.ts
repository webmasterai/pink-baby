export type CmsRole = "owner" | "admin" | "editor" | "order_manager" | "customer";

export type DocStatus = "draft" | "published";

export type CmsDocumentKey =
  | "site"
  | "home"
  | "nav"
  | "header"
  | "footer"
  | "contact"
  | "shipping_payments"
  | "seo_defaults"
  | "page:about"
  | "page:contact"
  | "page:delivery"
  | "page:returns"
  | "page:faq"
  | "page:privacy"
  | "page:terms"
  | "page:cart"
  | "page:checkout"
  | "page:account"
  | "page:order-tracking"
  | "page:wishlist"
  | "page:empty-states";

export type SiteCmsPayload = {
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  announcement: string;
  announcementVisible: boolean;
  logos: {
    primary: string;
    favicon: string;
  };
  contact: {
    addressLines: string[];
    whatsapp: { display: string; href: string; e164: string };
    call: { display: string; href: string };
    phones: { display: string; href: string; label: string }[];
    email: string;
    emailHref: string;
  };
  social: {
    facebook: string;
    instagram: string;
    youtube: string;
    pinterest: string;
  };
};

export type HomeCmsPayload = {
  sections: {
    key: string;
    visible: boolean;
    order: number;
  }[];
  hero: {
    line1: string;
    line2: string;
    support: string;
    cta: string;
    ctaHref: string;
    image: string;
    imageMobile: string;
    imageAlt?: string;
    imageMobileAlt?: string;
    objectPosition?: string;
    objectPositionMobile?: string;
  };
  benefits: { title: string; text: string; icon: string }[];
  categoriesHeading: string;
  categoriesSub: string;
  featuredHeading: string;
  featuredSub: string;
  promo: {
    heading: string;
    text: string;
    cta: string;
    ctaHref: string;
    image: string;
    imageAlt?: string;
    objectPosition?: string;
  };
  categoryItems?: {
    slug: string;
    titleOverride?: string;
    imageOverride?: string;
    imageAltOverride?: string;
  }[];
  featuredProductIds?: string[];
  newsletter: {
    heading: string;
    text: string;
    successMessage: string;
  };
};

export type NavItem = {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  children?: NavItem[];
};

export type NavCmsPayload = {
  items: NavItem[];
};

export type FooterCmsPayload = {
  columns: { title: string; links: { label: string; href: string }[] }[];
  blurb: string;
  showContact: boolean;
  showSocial: boolean;
};

export type PageSection =
  | {
      type: "richtext";
      id: string;
      heading?: string;
      body: string;
      image?: { src: string; alt: string };
    }
  | { type: "list"; id: string; heading?: string; items: string[] }
  | { type: "faq"; id: string; items: { question: string; answer: string }[] };

export type PageCmsPayload = {
  title: string;
  intro: string;
  sections: PageSection[];
  seo: {
    title: string;
    description: string;
    noindex: boolean;
    ogImage: string;
  };
};

export type ProductRecord = {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  status: "draft" | "published" | "archived";
  available: boolean;
  featured: boolean;
  primaryCategorySlug: string | null;
  categorySlugs: string[];
  shortDescription: string;
  description: string;
  image: string;
  imageAlt: string;
  images: { src: string; alt: string }[];
  pricing: {
    currency: string;
    price: number | null;
    regularPrice: number | null;
    salePrice: number | null;
    onSale: boolean;
  } | null;
  attributes: {
    name: string;
    taxonomy: string;
    hasVariations: boolean;
    terms: string[];
  }[];
  stockStatus: string;
  sourceUrl: string;
  seo: {
    title: string;
    description: string;
    ogImage: string;
  };
  relatedProductIds: string[];
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  stockVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryRecord = {
  id: string;
  sourceId: number | null;
  slug: string;
  name: string;
  displayName: string;
  parentSlug: string | null;
  description: string;
  image: string;
  navOrder: number;
  visible: boolean;
  href: string;
  filterAttrOrder: string[];
  seo: { title: string; description: string; ogImage: string };
  createdAt: string;
  updatedAt: string;
};

export type MediaAsset = {
  id: string;
  filename: string;
  path: string;
  mime: string;
  size: number;
  alt: string;
  createdAt: string;
  createdBy: string | null;
};

export type EnquiryRecord = {
  id: string;
  name: string;
  email: string;
  message: string;
  source: string;
  status: "new" | "read" | "archived";
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type SubscriberRecord = {
  id: string;
  email: string;
  status: "subscribed" | "unsubscribed";
  source: string;
  consentAt: string;
  createdAt: string;
};
