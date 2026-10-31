export const homeCopy = {
  hero: {
    line1: "Little moments.",
    line2: "Extraordinary love.",
    support: "Thoughtful feeding and care essentials\nfor you and your baby.",
    cta: "Shop essentials",
    ctaHref: "/category/feeding-bottles",
  },
  benefits: [
    {
      title: "Everyday comfort",
      text: "Thoughtful products for happier days.",
      icon: "heart" as const,
    },
    {
      title: "Made for little hands",
      text: "Safe, practical and easy to use.",
      icon: "hand" as const,
    },
    {
      title: "Delivery across Pakistan",
      text: "Bringing your baby essentials closer to you.",
      icon: "truck" as const,
    },
  ],
  categoriesHeading: "Made for every little moment",
  categoriesSub:
    "Explore feeding and care essentials chosen for everyday life with baby.",
  featuredHeading: "Everyday favourites",
  featuredSub: "A few of our most-loved essentials to get you started.",
  promo: {
    heading: "Comfort for you. Care for baby.",
    text: "Explore gentle breast-care essentials designed to support your feeding journey.",
    cta: "Explore breast care",
    ctaHref: "/category/breast-care",
  },
  newsletter: {
    heading: "A little love in your inbox",
    text: "Occasional updates on new arrivals and care tips. No spam.",
  },
} as const;

export const faqItems = [
  {
    question: "Do you deliver across Pakistan?",
    answer:
      "Pink Baby aims to bring baby essentials closer to families across Pakistan. Exact courier partners and timelines are confirmed when an order is accepted. Flat shipping appears at checkout only when SHIPPING_FLAT_PKR is configured.",
  },
  {
    question: "How do I place an order?",
    answer:
      "Add items to your cart and use Checkout to submit an order request with your contact and shipping details. You can also order a single product via WhatsApp (prefilled message only). Card/COD/bank options appear only when the business enables them.",
  },
  {
    question: "Can I track my order?",
    answer:
      "Yes — use Order Tracking with your order reference plus the email or phone used at checkout. Account holders can also view their own order history after signing in.",
  },
  {
    question: "How do returns and exchanges work?",
    answer:
      "See the Returns / Exchange page for the current draft process. Final policy wording should be confirmed by the business before launch.",
  },
] as const;

export const returnsCopy = {
  title: "Returns / Exchange",
  intro:
    "We want you to feel confident about every purchase. The outline below is a working draft for review — confirm timelines and conditions with the business before publishing as final policy.",
  points: [
    "Unused items in original packaging may be eligible for return or exchange within a reviewable window after delivery.",
    "Please contact customer care with your order reference once order management is live.",
    "Hygiene-sensitive products may have additional restrictions; these will be listed per product when catalogue rules are confirmed.",
  ],
} as const;

export const privacyCopy = {
  title: "Privacy Policy",
  draftNotice:
    "Draft for legal review. This is not final legal advice and must be reviewed before production use.",
  sections: [
    {
      heading: "What we collect",
      body: "Contact and newsletter forms collect the details you submit (such as name, email, and message). Cart and wishlist identifiers are stored locally in your browser and are not sent to our servers unless you submit a form or a future authenticated feature requires it.",
    },
    {
      heading: "How we use information",
      body: "Enquiry and newsletter data is used to respond to you or send the updates you requested. We do not sell personal information.",
    },
    {
      heading: "Storage and security",
      body: "Server-side submissions are validated and stored using deployment-configured durable storage. Email delivery, if enabled, uses server-only credentials.",
    },
  ],
} as const;

export const termsCopy = {
  title: "Terms of Use",
  draftNotice:
    "Draft for legal review. Confirm with counsel before presenting as binding terms.",
  sections: [
    {
      heading: "Website use",
      body: "Content on this site is provided for browsing Pink Baby products and information. Product availability may change.",
    },
    {
      heading: "Orders and payments",
      body: "Checkout, payment, and order fulfilment features require live integrations. Until those are connected, no paid order is completed through this website.",
    },
    {
      heading: "Accuracy",
      body: "We aim to keep product information accurate. Descriptions are limited to verified catalogue details; medical or certification claims are not invented for marketing.",
    },
  ],
} as const;
