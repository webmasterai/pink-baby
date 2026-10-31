import fs from "node:fs";
import path from "node:path";
import { catalogCategories, catalogProducts } from "@/content/catalog";
import { faqItems, privacyCopy, returnsCopy, termsCopy } from "@/content/pages";
import { siteConfig } from "@/content/site";
import { navLinks } from "@/content/categories";
import { ensureDocument } from "@/lib/cms/documents";
import { normalizeHomePayload } from "@/lib/cms/home-normalize";
import type {
  FooterCmsPayload,
  HomeCmsPayload,
  NavCmsPayload,
  PageCmsPayload,
  SiteCmsPayload,
} from "@/lib/cms/types";
import { getDb, newId, nowIso } from "@/lib/db";

function metaGet(key: string): string | null {
  const row = getDb()
    .prepare(`SELECT value FROM cms_meta WHERE key = ?`)
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

function metaSet(key: string, value: string) {
  getDb()
    .prepare(
      `INSERT INTO cms_meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, value);
}

function defaultSite(): SiteCmsPayload {
  return {
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    tagline: siteConfig.tagline,
    description: siteConfig.description,
    announcement: siteConfig.announcement,
    announcementVisible: true,
    logos: {
      primary: "/images/logo.png",
      favicon: "/images/favicon-32.png",
    },
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

function defaultHome(): HomeCmsPayload {
  // New documents only (ensureDocument never overwrites existing content).
  return normalizeHomePayload({});
}
function pagePayload(
  title: string,
  intro: string,
  sections: PageCmsPayload["sections"],
): PageCmsPayload {
  return {
    title,
    intro,
    sections,
    seo: { title, description: intro.slice(0, 160), noindex: false, ogImage: "" },
  };
}

function seedDocuments() {
  ensureDocument("site", "Site & brand", defaultSite());
  ensureDocument("home", "Homepage", defaultHome());
  ensureDocument("nav", "Navigation", {
    items: navLinks.map((l, i) => ({
      id: `nav-${i}`,
      label: l.name,
      href: l.href,
      visible: true,
    })),
  } satisfies NavCmsPayload);
  ensureDocument("header", "Header & announcement", {
    announcement: siteConfig.announcement,
    announcementVisible: true,
    showSearch: true,
    showWishlist: true,
    showAccount: true,
  });
  ensureDocument("footer", "Footer", {
    blurb: siteConfig.tagline,
    showContact: true,
    showSocial: true,
    columns: [
      {
        title: "Shop",
        links: navLinks.slice(0, 5).map((l) => ({ label: l.name, href: l.href })),
      },
      {
        title: "Care",
        links: [
          { label: "About", href: "/about" },
          { label: "Delivery", href: "/delivery" },
          { label: "Returns", href: "/returns" },
          { label: "FAQ", href: "/faq" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
        ],
      },
    ],
  } satisfies FooterCmsPayload);
  ensureDocument("contact", "Contact & social", {
    ...defaultSite().contact,
    social: defaultSite().social,
  });
  ensureDocument("shipping_payments", "Shipping & payments", {
    flatShippingPkr: process.env.SHIPPING_FLAT_PKR || "",
    freeShippingThresholdPkr: "",
    customerInstructions:
      "Shipping timelines are confirmed when your order is accepted.",
    paymentNotes: "Payment methods appear at checkout only when enabled.",
    notificationEmails: process.env.ADMIN_EMAILS || "",
  });
  ensureDocument("seo_defaults", "SEO defaults", {
    titleTemplate: `%s | ${siteConfig.name}`,
    defaultDescription: siteConfig.description,
    defaultOgImage: "/images/hero.png",
    twitterHandle: "",
  });

  ensureDocument(
    "page:about",
    "About page",
    pagePayload(
      "About Pink Baby",
      siteConfig.description,
      [
        {
          type: "richtext",
          id: "about-body",
          body: "Pink Baby brings thoughtful feeding and care essentials closer to families across Pakistan.",
        },
      ],
    ),
  );
  ensureDocument(
    "page:contact",
    "Contact page",
    pagePayload("Contact", "We would love to hear from you.", [
      {
        type: "richtext",
        id: "contact-help",
        body: "Use the form below or reach us on WhatsApp and phone during business hours.",
      },
    ]),
  );
  ensureDocument(
    "page:delivery",
    "Delivery page",
    pagePayload(
      "Delivery",
      "Delivery options for Pink Baby orders across Pakistan.",
      [
        {
          type: "list",
          id: "delivery-points",
          items: [
            "Courier partner and timeline are confirmed when an order is accepted.",
            "Flat shipping appears at checkout only when configured.",
          ],
        },
      ],
    ),
  );
  ensureDocument(
    "page:returns",
    "Returns page",
    pagePayload(returnsCopy.title, returnsCopy.intro, [
      { type: "list", id: "returns-points", items: [...returnsCopy.points] },
    ]),
  );
  ensureDocument(
    "page:faq",
    "FAQ page",
    pagePayload("FAQ", "Common questions about shopping with Pink Baby.", [
      {
        type: "faq",
        id: "faq-main",
        items: faqItems.map((f) => ({ question: f.question, answer: f.answer })),
      },
    ]),
  );
  ensureDocument(
    "page:privacy",
    "Privacy page",
    pagePayload(privacyCopy.title, privacyCopy.draftNotice, [
      ...privacyCopy.sections.map((s, i) => ({
        type: "richtext" as const,
        id: `privacy-${i}`,
        heading: s.heading,
        body: s.body,
      })),
    ]),
  );
  ensureDocument(
    "page:terms",
    "Terms page",
    pagePayload(termsCopy.title, termsCopy.draftNotice, [
      ...termsCopy.sections.map((s, i) => ({
        type: "richtext" as const,
        id: `terms-${i}`,
        heading: s.heading,
        body: s.body,
      })),
    ]),
  );
  ensureDocument(
    "page:cart",
    "Cart copy",
    pagePayload("Cart", "Review your items before checkout.", [
      {
        type: "richtext",
        id: "cart-empty",
        heading: "Empty cart",
        body: "Your cart is empty. Browse essentials to get started.",
      },
    ]),
  );
  ensureDocument(
    "page:checkout",
    "Checkout copy",
    pagePayload("Checkout", "Submit an order request with your details.", [
      {
        type: "richtext",
        id: "checkout-help",
        body: "We confirm availability, shipping, and payment after your request is received.",
      },
    ]),
  );
  ensureDocument(
    "page:account",
    "Account copy",
    pagePayload("Your account", "Manage orders and addresses.", []),
  );
  ensureDocument(
    "page:order-tracking",
    "Order tracking copy",
    pagePayload(
      "Track your order",
      "Enter your order reference plus the email or phone used at checkout.",
      [],
    ),
  );
  // ensureDocument is insert-if-missing only; existing documents are never overwritten.
  ensureDocument(
    "page:wishlist",
    "Wishlist copy",
    pagePayload("Wishlist", "Saved product identifiers stay in this browser only.", [
      {
        type: "richtext",
        id: "wishlist-empty",
        heading: "Your wishlist is empty",
        body: "Tap the heart on a product to save it for later.",
      },
    ]),
  );
  ensureDocument(
    "page:empty-states",
    "Empty & error messages",
    {
      title: "System messages",
      intro: "",
      sections: [
        {
          type: "richtext",
          id: "not-found",
          heading: "Page not found",
          body: "We could not find that page.",
        },
        {
          type: "richtext",
          id: "search-empty",
          heading: "No products",
          body: "No products matched your filters.",
        },
      ],
      seo: { title: "", description: "", noindex: true, ogImage: "" },
    } satisfies PageCmsPayload,
  );
}

function seedCatalog() {
  const db = getDb();
  const count = (
    db.prepare(`SELECT COUNT(*) AS c FROM cms_products`).get() as { c: number }
  ).c;
  if (count > 0) return;

  const at = nowIso();
  const insertCat = db.prepare(
    `INSERT INTO cms_categories
     (id, source_id, slug, name, display_name, parent_slug, description, image,
      nav_order, visible, payload_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, 1, ?, ?, ?)`,
  );
  catalogCategories.forEach((c, index) => {
    insertCat.run(
      String(c.id),
      c.sourceId,
      c.slug,
      c.name,
      c.displayName,
      c.parentSlug,
      c.image || "",
      index,
      JSON.stringify({
        seo: { title: c.displayName, description: "", ogImage: c.image || "" },
        filterAttrOrder: [],
      }),
      at,
      at,
    );
  });

  const insertProd = db.prepare(
    `INSERT INTO cms_products
     (id, slug, sku, name, status, available, featured, primary_category_slug,
      payload_json, stock_version, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?, 1, ?, ?)`,
  );
  for (const p of catalogProducts) {
    const payload = {
      categorySlugs: p.categorySlugs,
      shortDescription: p.shortDescription,
      description: p.description,
      image: p.image,
      imageAlt: p.imageAlt,
      images: p.images,
      pricing: p.pricing,
      attributes: p.attributes,
      stockStatus: p.stockStatus,
      sourceUrl: p.sourceUrl,
      seo: {
        title: p.name,
        description: p.shortDescription?.slice(0, 160) || "",
        ogImage: p.image,
      },
      relatedProductIds: [] as string[],
      saleStartsAt: null as string | null,
      saleEndsAt: null as string | null,
      importedAt: p.importedAt,
      type: p.type,
      variations: p.variations,
    };
    insertProd.run(
      p.id,
      p.slug,
      p.sku,
      p.name,
      p.available ? 1 : 0,
      p.featured ? 1 : 0,
      p.primaryCategorySlug,
      JSON.stringify(payload),
      at,
      at,
    );
  }
}

function migrateJsonFiles() {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  const db = getDb();
  const at = nowIso();

  try {
    const raw = fs.readFileSync(
      path.join(dataDir, "newsletter-subscribers.json"),
      "utf8",
    );
    const list = JSON.parse(raw) as { email: string; createdAt?: string; source?: string }[];
    const insert = db.prepare(
      `INSERT OR IGNORE INTO newsletter_subscribers
       (id, email, status, source, consent_at, created_at) VALUES (?, ?, 'subscribed', ?, ?, ?)`,
    );
    for (const row of list) {
      const created = row.createdAt || at;
      insert.run(newId("sub"), row.email, row.source || "website", created, created);
    }
  } catch {
    // missing file ok
  }

  try {
    const raw = fs.readFileSync(path.join(dataDir, "contact-enquiries.json"), "utf8");
    const list = JSON.parse(raw) as {
      id: string;
      name: string;
      email: string;
      message: string;
      createdAt: string;
    }[];
    const insert = db.prepare(
      `INSERT OR IGNORE INTO enquiries
       (id, name, email, message, source, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'contact', 'new', '', ?, ?)`,
    );
    for (const row of list) {
      insert.run(row.id, row.name, row.email, row.message, row.createdAt, row.createdAt);
    }
  } catch {
    // missing file ok
  }
}

function walkImages(dir: string, basePublic: string, out: { path: string; filename: string; mime: string }[]) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const st = fs.statSync(abs);
    if (st.isDirectory()) {
      walkImages(abs, `${basePublic}/${name}`, out);
      continue;
    }
    const ext = path.extname(name).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".gif"
              ? "image/gif"
              : ext === ".svg"
                ? "image/svg+xml"
                : ext === ".ico"
                  ? "image/x-icon"
                  : "";
    if (!mime) continue;
    out.push({ path: `${basePublic}/${name}`.replace(/\\/g, "/"), filename: name, mime });
  }
}

/** Index existing storefront images so Media Library / pickers show them immediately. */
function seedPublicMedia() {
  if (metaGet("cms_media_indexed_v1") === "1") return;
  const root = path.join(process.cwd(), "public", "images");
  const files: { path: string; filename: string; mime: string }[] = [];
  walkImages(root, "/images", files);
  const fav = path.join(process.cwd(), "public", "favicon.ico");
  if (fs.existsSync(fav)) {
    files.push({ path: "/favicon.ico", filename: "favicon.ico", mime: "image/x-icon" });
  }
  const db = getDb();
  const at = nowIso();
  const insert = db.prepare(
    `INSERT OR IGNORE INTO media_assets (id, filename, path, mime, size, alt, created_at, created_by)
     VALUES (?, ?, ?, ?, 0, ?, ?, NULL)`,
  );
  for (const f of files) {
    insert.run(newId("med"), f.filename, f.path, f.mime, f.filename.replace(/\.[^.]+$/, ""), at);
  }
  metaSet("cms_media_indexed_v1", "1");
}

function withSeedLock(fn: () => void) {
  const db = getDb();
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      db.exec("BEGIN IMMEDIATE");
      fn();
      db.exec("COMMIT");
      return;
    } catch (err) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // ignore
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (!/locked|busy/i.test(msg) || attempt === 7) throw err;
      // brief backoff for parallel next build workers
      const start = Date.now();
      while (Date.now() - start < 50 * (attempt + 1)) {
        // spin
      }
    }
  }
}

export function isCmsBootstrapped(): boolean {
  return metaGet("cms_seeded_v1") === "1" || metaGet("cms_bootstrapped") === "1";
}

/**
 * First-install bootstrap only. Does not re-apply seed on every startup.
 * Targeted content changes after bootstrap must use versioned migrations
 * (see docs/CMS-CONTENT-MIGRATIONS.md).
 */
export function ensureCmsSeeded() {
  withSeedLock(() => {
    if (isCmsBootstrapped()) {
      return;
    }
    seedDocuments();
    seedCatalog();
    migrateJsonFiles();
    seedPublicMedia();
    metaSet("cms_seeded_v1", "1");
    metaSet("cms_bootstrapped", "1");
    metaSet("cms_seeded_at", nowIso());
  });
}
