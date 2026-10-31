"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DocToolbar,
  Field,
  inputClass,
  useCmsDocument,
} from "@/components/admin/StructuredDocForm";
import { IconPicker, MediaPicker } from "@/components/admin/MediaPicker";
import {
  btnDanger,
  btnSecondary,
  btnSmall,
  Loading,
  Toggle,
} from "@/components/admin/AdminUi";
import { apiFetch } from "@/lib/client-fetch";
import { normalizeHomePayload } from "@/lib/cms/home-normalize";
import type { HomeCmsPayload } from "@/lib/cms/types";

type CategoryOption = {
  slug: string;
  displayName: string;
  image: string;
  parentSlug: string | null;
};

type ProductOption = {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  status: string;
  image: string;
  imageAlt: string;
};

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

function Collapsible({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left md:px-5"
      >
        <span>
          <span className="block text-base font-bold text-slate-900">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-sm font-normal text-slate-500">{description}</span>
          ) : null}
        </span>
        <span className="mt-1 text-xs font-semibold text-slate-500">{open ? "Hide ▲" : "Show ▼"}</span>
      </button>
      {open ? <div className="border-t border-slate-100 p-4 md:p-5">{children}</div> : null}
    </section>
  );
}

function MoveButtons({
  index,
  length,
  onMove,
}: {
  index: number;
  length: number;
  onMove: (to: number) => void;
}) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        className={`${btnSecondary} ${btnSmall}`}
        disabled={index === 0}
        aria-label="Move up"
        onClick={() => onMove(index - 1)}
      >
        ↑
      </button>
      <button
        type="button"
        className={`${btnSecondary} ${btnSmall}`}
        disabled={index === length - 1}
        aria-label="Move down"
        onClick={() => onMove(index + 1)}
      >
        ↓
      </button>
    </div>
  );
}

function Thumb({ src, alt }: { src?: string; alt?: string }) {
  return (
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || ""} className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

function LinkNote({
  note,
  links,
}: {
  note: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">{note}</p>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`${btnSecondary} ${btnSmall}`}>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminHomepagePage() {
  const doc = useCmsDocument<HomeCmsPayload>("home");
  const p = useMemo(() => (doc.payload ? normalizeHomePayload(doc.payload) : null), [doc.payload]);

  const [catalog, setCatalog] = useState<CategoryOption[]>([]);
  const [addSlug, setAddSlug] = useState("");
  const [productLookup, setProductLookup] = useState<Record<string, ProductOption>>({});
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch("/api/admin/cms/categories");
        const data = (await res.json()) as { categories?: CategoryOption[] };
        if (alive && res.ok) setCatalog(data.categories || []);
      } catch {
        // category names fall back to slugs
      }
    })();
    (async () => {
      try {
        const res = await apiFetch("/api/admin/cms/products");
        const data = (await res.json()) as { products?: ProductOption[] };
        if (alive && res.ok) {
          setProductLookup((prev) => {
            const next = { ...prev };
            for (const pr of data.products || []) next[pr.id] = pr;
            return next;
          });
        }
      } catch {
        // product names fall back to ids
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const q = productQuery.trim();
    if (!q) return;
    let alive = true;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiFetch(`/api/admin/cms/products?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { products?: ProductOption[] };
        if (!alive) return;
        const list = res.ok ? data.products || [] : [];
        setProductResults(list.slice(0, 12));
        setProductLookup((prev) => {
          const next = { ...prev };
          for (const pr of list) next[pr.id] = pr;
          return next;
        });
      } catch {
        if (alive) setProductResults([]);
      } finally {
        if (alive) setSearching(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [productQuery]);

  const catBySlug = useMemo(() => {
    const m = new Map<string, CategoryOption>();
    for (const c of catalog) m.set(c.slug, c);
    return m;
  }, [catalog]);

  if (!p) {
    return (
      <div className="space-y-5">
        <DocToolbar
          title="Homepage"
          description="Everything shown on the storefront homepage, in page order."
          meta={doc.meta}
          dirty={doc.dirty}
          busy={doc.busy}
          error={doc.error}
          ok={doc.ok}
          onSave={doc.saveDraft}
          onPublish={doc.publish}
          previewHref="/?preview=1"
        />
        <Loading />
      </div>
    );
  }

  const update = (next: HomeCmsPayload) => doc.update(next);
  const setHero = (patch: Partial<HomeCmsPayload["hero"]>) =>
    update({ ...p, hero: { ...p.hero, ...patch } });
  const setPromo = (patch: Partial<HomeCmsPayload["promo"]>) =>
    update({ ...p, promo: { ...p.promo, ...patch } });

  const categoryItems = p.categoryItems ?? [];
  const setCategoryItem = (
    i: number,
    patch: Partial<NonNullable<HomeCmsPayload["categoryItems"]>[number]>,
  ) => {
    const items = [...categoryItems];
    items[i] = { ...items[i]!, ...patch };
    update({ ...p, categoryItems: items });
  };
  const availableCategories = catalog.filter(
    (c) => c.slug !== "sale" && !categoryItems.some((i) => i.slug === c.slug),
  );

  const featuredIds = p.featuredProductIds;
  const selectedIds = featuredIds ?? [];
  const setFeatured = (ids: string[]) => update({ ...p, featuredProductIds: ids });

  return (
    <div className="space-y-4">
      <DocToolbar
        title="Homepage"
        description="Everything shown on the storefront homepage, in page order."
        meta={doc.meta}
        dirty={doc.dirty}
        busy={doc.busy}
        error={doc.error}
        ok={doc.ok}
        onSave={doc.saveDraft}
        onPublish={doc.publish}
        previewHref="/?preview=1"
      />

      <Collapsible
        title="1. Header & announcement"
        description="Shown above every page."
        defaultOpen={false}
      >
        <LinkNote
          note="The announcement bar, header options, contact details and menu are global and are edited in their own screens."
          links={[
            { href: "/admin/header", label: "Edit global header" },
            { href: "/admin/contact", label: "Edit contact" },
            { href: "/admin/navigation", label: "Edit navigation" },
          ]}
        />
      </Collapsible>

      <Collapsible title="2. Hero" description="Top banner with headline and button.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Headline line 1">
            <input
              className={inputClass}
              value={p.hero.line1}
              onChange={(e) => setHero({ line1: e.target.value })}
            />
          </Field>
          <Field label="Headline line 2">
            <input
              className={inputClass}
              value={p.hero.line2}
              onChange={(e) => setHero({ line2: e.target.value })}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Supporting text">
              <textarea
                rows={3}
                className={inputClass}
                value={p.hero.support}
                onChange={(e) => setHero({ support: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Button label">
            <input
              className={inputClass}
              value={p.hero.cta}
              onChange={(e) => setHero({ cta: e.target.value })}
            />
          </Field>
          <Field label="Button link">
            <input
              className={inputClass}
              value={p.hero.ctaHref}
              onChange={(e) => setHero({ ctaHref: e.target.value })}
            />
          </Field>
          <div className="space-y-3">
            <MediaPicker
              label="Hero image (desktop / tablet)"
              value={p.hero.image}
              alt={p.hero.imageAlt ?? ""}
              onChange={({ src, alt }) =>
                setHero({ image: src, imageAlt: alt ?? p.hero.imageAlt ?? "" })
              }
            />
            <Field
              label="Desktop image focus"
              hint='CSS object-position, e.g. "72% center". Leave empty for the default.'
            >
              <input
                className={inputClass}
                placeholder="72% center"
                value={p.hero.objectPosition ?? ""}
                onChange={(e) => setHero({ objectPosition: e.target.value })}
              />
            </Field>
          </div>
          <div className="space-y-3">
            <MediaPicker
              label="Hero image (mobile)"
              value={p.hero.imageMobile}
              alt={p.hero.imageMobileAlt ?? ""}
              hint="Used on screens below the md breakpoint (768px)."
              onChange={({ src, alt }) =>
                setHero({ imageMobile: src, imageMobileAlt: alt ?? p.hero.imageMobileAlt ?? "" })
              }
            />
            <Field
              label="Mobile image focus"
              hint='CSS object-position, e.g. "62% center". Leave empty for the default.'
            >
              <input
                className={inputClass}
                placeholder="62% center"
                value={p.hero.objectPositionMobile ?? ""}
                onChange={(e) => setHero({ objectPositionMobile: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </Collapsible>

      <Collapsible
        title="3. Benefits / trust strip"
        description="Short trust points shown under the hero."
      >
        <div className="space-y-4">
          <div>
            <button
              type="button"
              className={`${btnSecondary} ${btnSmall}`}
              onClick={() =>
                update({ ...p, benefits: [...p.benefits, { title: "", text: "", icon: "" }] })
              }
            >
              + Add benefit
            </button>
          </div>
          {p.benefits.length === 0 ? (
            <p className="text-sm text-slate-500">No benefits yet.</p>
          ) : null}
          {p.benefits.map((b, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Title">
                  <input
                    className={inputClass}
                    value={b.title}
                    onChange={(e) => {
                      const benefits = [...p.benefits];
                      benefits[i] = { ...b, title: e.target.value };
                      update({ ...p, benefits });
                    }}
                  />
                </Field>
                <IconPicker
                  label="Icon"
                  value={b.icon || "heart"}
                  onChange={(icon) => {
                    const benefits = [...p.benefits];
                    benefits[i] = { ...b, icon };
                    update({ ...p, benefits });
                  }}
                />
                <div className="flex items-end justify-end gap-2">
                  <MoveButtons
                    index={i}
                    length={p.benefits.length}
                    onMove={(to) => update({ ...p, benefits: moveItem(p.benefits, i, to) })}
                  />
                  <button
                    type="button"
                    className={`${btnDanger} ${btnSmall}`}
                    onClick={() => update({ ...p, benefits: p.benefits.filter((_, j) => j !== i) })}
                  >
                    Remove
                  </button>
                </div>
                <div className="md:col-span-3">
                  <Field label="Text">
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={b.text}
                      onChange={(e) => {
                        const benefits = [...p.benefits];
                        benefits[i] = { ...b, text: e.target.value };
                        update({ ...p, benefits });
                      }}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Collapsible>

      <Collapsible
        title="4. Categories"
        description="Category cards shown on the homepage, in this order."
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Heading">
              <input
                className={inputClass}
                value={p.categoriesHeading}
                onChange={(e) => update({ ...p, categoriesHeading: e.target.value })}
              />
            </Field>
            <Field label="Subtitle">
              <input
                className={inputClass}
                value={p.categoriesSub}
                onChange={(e) => update({ ...p, categoriesSub: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-56 flex-1">
              <Field label="Add a category">
                <select
                  className={inputClass}
                  value={addSlug}
                  onChange={(e) => setAddSlug(e.target.value)}
                >
                  <option value="">Select from catalog…</option>
                  {availableCategories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.parentSlug ? `${c.parentSlug} › ` : ""}
                      {c.displayName}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <button
              type="button"
              className={`${btnSecondary} ${btnSmall}`}
              disabled={!addSlug}
              onClick={() => {
                update({ ...p, categoryItems: [...categoryItems, { slug: addSlug }] });
                setAddSlug("");
              }}
            >
              + Add
            </button>
          </div>

          {categoryItems.length === 0 ? (
            <p className="text-sm text-slate-500">
              No categories selected. The homepage will show an empty category grid.
            </p>
          ) : null}
          {categoryItems.map((item, i) => {
            const cat = catBySlug.get(item.slug);
            const thumb = item.imageOverride || cat?.image || "";
            return (
              <div key={`${item.slug}-${i}`} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <Thumb src={thumb} alt={item.imageAltOverride || cat?.displayName} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-900">
                      {cat?.displayName ?? item.slug}
                    </div>
                    <div className="text-xs text-slate-500">/{item.slug}</div>
                  </div>
                  <MoveButtons
                    index={i}
                    length={categoryItems.length}
                    onMove={(to) =>
                      update({ ...p, categoryItems: moveItem(categoryItems, i, to) })
                    }
                  />
                  <button
                    type="button"
                    className={`${btnDanger} ${btnSmall}`}
                    onClick={() =>
                      update({ ...p, categoryItems: categoryItems.filter((_, j) => j !== i) })
                    }
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Title override" hint="Leave empty to use the category name.">
                    <input
                      className={inputClass}
                      value={item.titleOverride ?? ""}
                      onChange={(e) => setCategoryItem(i, { titleOverride: e.target.value })}
                    />
                  </Field>
                  <MediaPicker
                    label="Image override"
                    value={item.imageOverride ?? ""}
                    alt={item.imageAltOverride ?? ""}
                    hint="Leave empty to use the category image."
                    onChange={({ src, alt }) =>
                      setCategoryItem(i, {
                        imageOverride: src,
                        imageAltOverride: alt ?? item.imageAltOverride ?? "",
                      })
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Collapsible>

      <Collapsible
        title="5. Featured products"
        description="Products shown in the featured grid. Price and stock are edited on the product."
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Heading">
              <input
                className={inputClass}
                value={p.featuredHeading}
                onChange={(e) => update({ ...p, featuredHeading: e.target.value })}
              />
            </Field>
            <Field label="Subtitle">
              <input
                className={inputClass}
                value={p.featuredSub}
                onChange={(e) => update({ ...p, featuredSub: e.target.value })}
              />
            </Field>
          </div>

          {featuredIds === undefined ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <span>
                No manual selection: the storefront shows products flagged “featured” in the
                catalog.
              </span>
              <button
                type="button"
                className={`${btnSecondary} ${btnSmall}`}
                onClick={() => setFeatured([])}
              >
                Choose products manually
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
              <span>
                {featuredIds.length === 0
                  ? "Manual selection is empty: no featured products will be shown."
                  : `${featuredIds.length} product${featuredIds.length === 1 ? "" : "s"} selected.`}
              </span>
              <button
                type="button"
                className={`${btnSecondary} ${btnSmall}`}
                onClick={() => {
                  const { featuredProductIds: _drop, ...rest } = p;
                  void _drop;
                  update(rest as HomeCmsPayload);
                }}
              >
                Use “featured” flag instead
              </button>
            </div>
          )}

          {featuredIds !== undefined ? (
            <>
              <div>
                <Field label="Search products to add" hint="Search by name, SKU or category.">
                  <input
                    className={inputClass}
                    placeholder="Search…"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                  />
                </Field>
                {productQuery.trim() ? (
                  <div className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {searching && productResults.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-500">Searching…</p>
                    ) : null}
                    {!searching && productResults.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-500">No products found.</p>
                    ) : null}
                    {productResults.map((pr) => {
                      const added = selectedIds.includes(pr.id);
                      return (
                        <div key={pr.id} className="flex items-center gap-3 px-3 py-2">
                          <Thumb src={pr.image} alt={pr.imageAlt} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {pr.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {pr.sku ? `SKU ${pr.sku} · ` : ""}
                              {pr.status}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`${btnSecondary} ${btnSmall}`}
                            disabled={added}
                            onClick={() => setFeatured([...selectedIds, pr.id])}
                          >
                            {added ? "Added" : "+ Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                {selectedIds.map((id, i) => {
                  const pr = productLookup[id];
                  return (
                    <div
                      key={`${id}-${i}`}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3"
                    >
                      <Thumb src={pr?.image} alt={pr?.imageAlt} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-900">
                          {pr?.name ?? "Unknown product"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {pr?.sku ? `SKU ${pr.sku} · ` : ""}
                          {pr ? pr.status : id}
                          {pr && pr.status !== "published" ? " (hidden on storefront)" : ""}
                        </div>
                      </div>
                      <Link
                        href={`/admin/products/${id}`}
                        className={`${btnSecondary} ${btnSmall}`}
                      >
                        Edit product
                      </Link>
                      <MoveButtons
                        index={i}
                        length={selectedIds.length}
                        onMove={(to) => setFeatured(moveItem(selectedIds, i, to))}
                      />
                      <button
                        type="button"
                        className={`${btnDanger} ${btnSmall}`}
                        onClick={() => setFeatured(selectedIds.filter((_, j) => j !== i))}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </Collapsible>

      <Collapsible
        title="6. Breast care / promotional banner"
        description="Large banner below the featured products."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Heading">
            <input
              className={inputClass}
              value={p.promo.heading}
              onChange={(e) => setPromo({ heading: e.target.value })}
            />
          </Field>
          <div />
          <div className="space-y-3 md:col-span-2">
            <MediaPicker
              label="Promo banner image"
              value={p.promo.image}
              alt={p.promo.imageAlt ?? ""}
              onChange={({ src, alt }) =>
                setPromo({ image: src, imageAlt: alt ?? p.promo.imageAlt ?? "" })
              }
            />
            <Field
              label="Image focus"
              hint='CSS object-position, e.g. "78% center". Leave empty for the default.'
            >
              <input
                className={inputClass}
                placeholder="78% center"
                value={p.promo.objectPosition ?? ""}
                onChange={(e) => setPromo({ objectPosition: e.target.value })}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Text">
              <textarea
                rows={3}
                className={inputClass}
                value={p.promo.text}
                onChange={(e) => setPromo({ text: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Button label">
            <input
              className={inputClass}
              value={p.promo.cta}
              onChange={(e) => setPromo({ cta: e.target.value })}
            />
          </Field>
          <Field label="Button link">
            <input
              className={inputClass}
              value={p.promo.ctaHref}
              onChange={(e) => setPromo({ ctaHref: e.target.value })}
            />
          </Field>
        </div>
      </Collapsible>

      <Collapsible title="7. Newsletter" description="Sign-up block near the bottom of the page.">
        <div className="grid gap-4">
          <Field label="Heading">
            <input
              className={inputClass}
              value={p.newsletter.heading}
              onChange={(e) =>
                update({ ...p, newsletter: { ...p.newsletter, heading: e.target.value } })
              }
            />
          </Field>
          <Field label="Text">
            <textarea
              rows={2}
              className={inputClass}
              value={p.newsletter.text}
              onChange={(e) =>
                update({ ...p, newsletter: { ...p.newsletter, text: e.target.value } })
              }
            />
          </Field>
          <Field label="Success message">
            <input
              className={inputClass}
              value={p.newsletter.successMessage}
              onChange={(e) =>
                update({ ...p, newsletter: { ...p.newsletter, successMessage: e.target.value } })
              }
            />
          </Field>
        </div>
      </Collapsible>

      <Collapsible title="8. Footer" description="Shown at the bottom of every page." defaultOpen={false}>
        <LinkNote
          note="Footer columns, blurb, contact and social links are global and are edited in their own screens."
          links={[
            { href: "/admin/footer", label: "Edit footer" },
            { href: "/admin/contact", label: "Edit contact" },
          ]}
        />
      </Collapsible>

      <Collapsible
        title="9. Section visibility & order"
        description="Lower order numbers appear first on the homepage."
      >
        <div className="space-y-2">
          {[...p.sections]
            .map((s, idx) => ({ s, idx }))
            .sort((a, b) => a.s.order - b.s.order)
            .map(({ s, idx }) => (
              <div
                key={s.key}
                className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 px-3 py-2"
              >
                <span className="w-28 text-sm font-semibold capitalize text-slate-800">{s.key}</span>
                <Toggle
                  label="Visible"
                  checked={s.visible}
                  onChange={(visible) => {
                    const sections = [...p.sections];
                    sections[idx] = { ...s, visible };
                    update({ ...p, sections });
                  }}
                />
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  Order
                  <input
                    type="number"
                    className={`${inputClass} !w-20`}
                    value={s.order}
                    onChange={(e) => {
                      const sections = [...p.sections];
                      sections[idx] = { ...s, order: Number(e.target.value) || 0 };
                      update({ ...p, sections });
                    }}
                  />
                </label>
              </div>
            ))}
        </div>
      </Collapsible>
    </div>
  );
}
