export const siteConfig = {
  name: "Pink Baby",
  legalName: "Pinkbaby",
  tagline: "Little essentials. Lots of love.",
  description:
    "Thoughtful feeding and care essentials for you and your baby.",
  currency: "PKR" as const,
  currencySymbol: "Rs",
  locale: "en-PK",
  announcement: "Little essentials. Lots of love.",
  contact: {
    // Verified from public site https://pinkbaby.pk/
    addressLines: [
      "P-47, St # 1, Diglous Pura",
      "Faisalabad, Punjab, Pakistan",
    ],
    whatsapp: {
      display: "+92 323 6074124",
      href: "https://wa.me/923236074124",
      e164: "923236074124",
    },
    call: {
      display: "+92 41-2646530",
      href: "tel:+92412646530",
    },
    phones: [
      { display: "+92 323 6074124", href: "tel:+923236074124", label: "WhatsApp" },
      { display: "+92 41-2646530", href: "tel:+92412646530", label: "Call" },
      { display: "+92 300 9652928", href: "tel:+923009652928", label: "Phone" },
    ],
    phoneDisplay: "+92 323 6074124",
    phoneHref: "tel:+923236074124",
    email: "pinkbaby.pakistan@gmail.com",
    emailHref: "mailto:pinkbaby.pakistan@gmail.com",
  },
  social: {
    // Only include URLs verified from the public site; keep placeholders as inactive hashes when unknown.
    facebook: "#",
    instagram: "#",
    youtube: "#",
    pinterest: "#",
  },
  /**
   * Integrations that need business credentials / external verification.
   * Flip only after real configuration + testing.
   */
  pendingIntegrations: {
    cardPayments: true,
    smtpEmail: true,
    shippingRates: true,
    cloudflare: true,
  },
} as const;

export type SiteConfig = typeof siteConfig;
