import Link from "next/link";

type Option = { value: string; label: string };

type Props = {
  action: string;
  q?: string;
  category?: string;
  availability?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  categories: Option[];
  hideCategory?: boolean;
  clearHref: string;
};

export function CatalogToolbar({
  action,
  q = "",
  category = "",
  availability = "",
  sort = "featured",
  minPrice = "",
  maxPrice = "",
  categories,
  hideCategory,
  clearHref,
}: Props) {
  return (
    <form
      method="get"
      action={action}
      className="mb-8 grid gap-3 rounded-2xl border border-pb-border bg-white p-4 md:grid-cols-2 lg:grid-cols-6 lg:items-end"
    >
      <label className="block text-sm font-semibold lg:col-span-2">
        Search
        <input
          className="pb-input mt-1"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Name or SKU"
        />
      </label>
      {!hideCategory ? (
        <label className="block text-sm font-semibold">
          Category
          <select className="pb-input mt-1" name="category" defaultValue={category}>
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block text-sm font-semibold">
        Availability
        <select className="pb-input mt-1" name="availability" defaultValue={availability}>
          <option value="">Any</option>
          <option value="in-stock">In stock</option>
          <option value="out-of-stock">Out of stock</option>
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Sort
        <select className="pb-input mt-1" name="sort" defaultValue={sort}>
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name-asc">Name: A–Z</option>
          <option value="name-desc">Name: Z–A</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm font-semibold">
          Min Rs
          <input
            className="pb-input mt-1"
            type="number"
            name="minPrice"
            min={0}
            defaultValue={minPrice}
          />
        </label>
        <label className="block text-sm font-semibold">
          Max Rs
          <input
            className="pb-input mt-1"
            type="number"
            name="maxPrice"
            min={0}
            defaultValue={maxPrice}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2 lg:col-span-6">
        <button type="submit" className="pb-btn pb-btn-primary">
          Apply filters
        </button>
        <Link href={clearHref} className="pb-btn pb-btn-outline">
          Clear filters
        </Link>
      </div>
    </form>
  );
}

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={makeHref(page - 1)} className="pb-btn pb-btn-outline px-4 py-2 text-sm">
          Previous
        </Link>
      ) : null}
      <span className="text-sm text-pb-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={makeHref(page + 1)} className="pb-btn pb-btn-outline px-4 py-2 text-sm">
          Next
        </Link>
      ) : null}
    </nav>
  );
}
