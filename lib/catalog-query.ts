import type { Product } from "@/content/products-client";

export type CatalogQuery = {
  q?: string;
  /** Single category (legacy) or multi via categories[] */
  category?: string;
  /** OR within selected category slugs */
  categories?: string[];
  availability?: "in-stock" | "out-of-stock" | "";
  /** Filter products in sale category or with onSale pricing */
  onSale?: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
  attribute?: string;
  sort?: "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";
  page?: number;
  pageSize?: number;
};

export type CatalogPage = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function parseCategoryParams(
  category?: string | string[],
  cats?: string | string[],
): string[] {
  const out = new Set<string>();
  const push = (v?: string | string[]) => {
    if (!v) return;
    const list = Array.isArray(v) ? v : v.split(",");
    for (const item of list) {
      const s = item.trim();
      if (s) out.add(s);
    }
  };
  push(category);
  push(cats);
  return [...out];
}

export function filterSortPaginate(
  products: Product[],
  query: CatalogQuery,
): CatalogPage {
  let items = [...products];

  const q = query.q?.trim().toLowerCase();
  if (q) {
    items = items.filter((p) => {
      const hay = [p.name, p.sku, p.shortDescription, ...p.categorySlugs]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  const cats =
    query.categories && query.categories.length
      ? query.categories
      : query.category
        ? [query.category]
        : [];
  if (cats.length === 1) {
    items = items.filter((p) => p.categorySlugs.includes(cats[0]!));
  } else if (cats.length > 1) {
    items = items.filter((p) => cats.some((c) => p.categorySlugs.includes(c)));
  }

  if (query.availability === "in-stock") {
    items = items.filter((p) => p.available);
  } else if (query.availability === "out-of-stock") {
    items = items.filter((p) => !p.available);
  }

  if (query.onSale) {
    items = items.filter(
      (p) => p.pricing?.onSale || p.categorySlugs.includes("sale"),
    );
  }

  let minP = query.minPrice;
  let maxP = query.maxPrice;
  if (minP != null && maxP != null && minP > maxP) {
    const t = minP;
    minP = maxP;
    maxP = t;
  }
  if (minP != null && Number.isFinite(minP)) {
    items = items.filter(
      (p) => p.pricing?.price != null && p.pricing.price >= minP!,
    );
  }
  if (maxP != null && Number.isFinite(maxP)) {
    items = items.filter(
      (p) => p.pricing?.price != null && p.pricing.price <= maxP!,
    );
  }

  const attr = query.attribute?.trim();
  if (attr) {
    const [attrName, attrValue] = attr.includes(":")
      ? [
          attr.split(":")[0]!.trim().toLowerCase(),
          attr.split(":").slice(1).join(":").trim().toLowerCase(),
        ]
      : [null, attr.toLowerCase()];
    items = items.filter((p) =>
      p.attributes.some((a) => {
        const nameOk = !attrName || a.name.toLowerCase() === attrName;
        const termOk = a.terms.some((t) => t.toLowerCase().includes(attrValue));
        return nameOk && termOk;
      }),
    );
  }

  const sort = query.sort || "featured";
  items.sort((a, b) => {
    const ap = a.pricing?.price ?? Number.POSITIVE_INFINITY;
    const bp = b.pricing?.price ?? Number.POSITIVE_INFINITY;
    switch (sort) {
      case "price-asc":
        return ap - bp;
      case "price-desc":
        return bp - ap;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "featured":
      default:
        return Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name);
    }
  });

  const pageSize = Math.min(48, Math.max(8, query.pageSize || 24));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(totalPages, Math.max(1, query.page || 1));
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export function relatedProducts(
  product: Product,
  all: Product[],
  limit = 4,
): Product[] {
  return all
    .filter(
      (p) =>
        p.id !== product.id &&
        p.categorySlugs.some((s) => product.categorySlugs.includes(s)),
    )
    .slice(0, limit);
}

export type FilterState = {
  q: string;
  categories: string[];
  availability: "" | "in-stock" | "out-of-stock";
  onSale: boolean;
  minPrice: string;
  maxPrice: string;
  sort: string;
  view: "grid" | "list";
  page: number;
};

export function filterStateFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): FilterState {
  const cats = parseCategoryParams(
    typeof sp.category === "string" || Array.isArray(sp.category)
      ? sp.category
      : undefined,
    typeof sp.cats === "string" || Array.isArray(sp.cats) ? sp.cats : undefined,
  );
  const view = sp.view === "list" ? "list" : "grid";
  return {
    q: typeof sp.q === "string" ? sp.q : "",
    categories: cats,
    availability:
      sp.availability === "in-stock" || sp.availability === "out-of-stock"
        ? sp.availability
        : "",
    onSale: sp.onSale === "1" || sp.onSale === "true",
    minPrice: typeof sp.minPrice === "string" ? sp.minPrice : "",
    maxPrice: typeof sp.maxPrice === "string" ? sp.maxPrice : "",
    sort: typeof sp.sort === "string" ? sp.sort : "featured",
    view,
    page: Number(typeof sp.page === "string" ? sp.page : 1) || 1,
  };
}

export function buildFilterHref(
  basePath: string,
  state: Partial<FilterState>,
  resetPage = true,
): string {
  const params = new URLSearchParams();
  if (state.q?.trim()) params.set("q", state.q.trim());
  if (state.categories?.length) params.set("cats", state.categories.join(","));
  if (state.availability) params.set("availability", state.availability);
  if (state.onSale) params.set("onSale", "1");
  if (state.minPrice) params.set("minPrice", state.minPrice);
  if (state.maxPrice) params.set("maxPrice", state.maxPrice);
  if (state.sort && state.sort !== "featured") params.set("sort", state.sort);
  if (state.view === "list") params.set("view", "list");
  if (!resetPage && state.page && state.page > 1) {
    params.set("page", String(state.page));
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
