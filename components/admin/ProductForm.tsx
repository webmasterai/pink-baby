"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Field, inputClass } from "@/components/admin/StructuredDocForm";
import { GalleryPicker, MediaPicker } from "@/components/admin/MediaPicker";
import {
  btnPrimary,
  btnSecondary,
  Card,
  Loading,
  Notice,
  readJson,
  Toggle,
} from "@/components/admin/AdminUi";
import { apiFetch } from "@/lib/client-fetch";
import type { ProductRecord } from "@/lib/cms/types";

type FormState = {
  name: string;
  slug: string;
  sku: string;
  status: ProductRecord["status"];
  categories: string;
  shortDescription: string;
  description: string;
  regularPrice: string;
  salePrice: string;
  available: boolean;
  featured: boolean;
  images: { src: string; alt: string }[];
  seoTitle: string;
  seoDescription: string;
  seoOgImage: string;
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  sku: "",
  status: "draft",
  categories: "",
  shortDescription: "",
  description: "",
  regularPrice: "",
  salePrice: "",
  available: true,
  featured: false,
  images: [],
  seoTitle: "",
  seoDescription: "",
  seoOgImage: "",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fromRecord(r: ProductRecord): FormState {
  return {
    name: r.name,
    slug: r.slug,
    sku: r.sku || "",
    status: r.status,
    categories: r.categorySlugs.join(", "),
    shortDescription: r.shortDescription,
    description: r.description,
    regularPrice: r.pricing?.regularPrice != null ? String(r.pricing.regularPrice) : r.pricing?.price != null ? String(r.pricing.price) : "",
    salePrice: r.pricing?.salePrice != null ? String(r.pricing.salePrice) : "",
    available: r.available,
    featured: r.featured,
    images:
      r.images?.length > 0
        ? r.images.map((i) => ({ src: i.src, alt: i.alt || "" }))
        : r.image
          ? [{ src: r.image, alt: r.imageAlt || "" }]
          : [],
    seoTitle: r.seo?.title || "",
    seoDescription: r.seo?.description || "",
    seoOgImage: r.seo?.ogImage || "",
  };
}

function parsePrice(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isNew = !productId;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [record, setRecord] = useState<ProductRecord | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function load() {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/admin/cms/products/${encodeURIComponent(productId)}`);
      const data = await readJson<{ product?: ProductRecord }>(res);
      if (!res.ok || !data.product) throw new Error(data.error || "Failed to load product");
      setRecord(data.product);
      setForm(fromRecord(data.product));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setError(null);
    setOk(null);
    if (!form.name.trim() || !form.slug.trim()) {
      setError("Name and slug are required.");
      return;
    }
    const regular = parsePrice(form.regularPrice);
    const sale = parsePrice(form.salePrice);
    if (Number.isNaN(regular) || Number.isNaN(sale)) {
      setError("Prices must be valid non-negative numbers.");
      return;
    }
    if (sale != null && regular != null && sale > regular) {
      setError("Sale price cannot be higher than the regular price.");
      return;
    }
    const categorySlugs = form.categories
      .split(",")
      .map((s) => slugify(s))
      .filter(Boolean);
    const onSale = sale != null;
    const price = onSale ? sale : regular;
    const pricing =
      price == null && regular == null
        ? null
        : {
            currency: record?.pricing?.currency || "PKR",
            price,
            regularPrice: regular,
            salePrice: sale,
            onSale,
          };
    const images = form.images.filter((i) => i.src.trim());
    const main = images[0];
    const body = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      sku: form.sku.trim() || null,
      status: form.status,
      categorySlugs,
      primaryCategorySlug: categorySlugs[0] ?? null,
      shortDescription: form.shortDescription,
      description: form.description,
      pricing,
      available: form.available,
      featured: form.featured,
      image: main?.src || "",
      imageAlt: main?.alt || "",
      images,
      seo: {
        title: form.seoTitle,
        description: form.seoDescription,
        ogImage: form.seoOgImage,
      },
    };

    setBusy(true);
    try {
      if (isNew) {
        const res = await apiFetch("/api/admin/cms/products", { method: "POST", json: body });
        const data = await readJson<{ product?: ProductRecord }>(res);
        if (!res.ok || !data.product) throw new Error(data.error || "Could not create product");
        router.push(`/admin/products/${encodeURIComponent(data.product.id)}`);
        return;
      }
      const res = await apiFetch(`/api/admin/cms/products/${encodeURIComponent(productId!)}`, {
        method: "PUT",
        json: { ...body, expectedStockVersion: record?.stockVersion },
      });
      const data = await readJson<{ product?: ProductRecord }>(res);
      if (!res.ok || !data.product) throw new Error(data.error || "Could not save product");
      setRecord(data.product);
      setForm(fromRecord(data.product));
      setOk("Product saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!productId || !confirm("Archive this product? It will be hidden from the storefront.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/admin/cms/products/${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not archive");
      router.push("/admin/products");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not archive");
      setBusy(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <Link href="/admin/products" className="text-sm font-semibold text-pb-pink hover:underline">
        ← All products
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">
            {isNew ? "New product" : `Edit: ${record?.name || ""}`}
          </h2>
          {record ? (
            <p className="mt-1 text-xs text-slate-400">Last updated {new Date(record.updatedAt).toLocaleString()}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          {!isNew ? (
            <button type="button" className={btnSecondary} disabled={busy} onClick={() => void archive()}>
              Archive
            </button>
          ) : null}
          <button type="button" className={btnPrimary} disabled={busy} onClick={() => void save()}>
            {isNew ? "Create product" : "Save product"}
          </button>
        </div>
      </div>
      <Notice error={error} ok={ok} />

      <Card title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Slug" hint="URL-friendly identifier.">
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
            />
          </Field>
          <Field label="SKU">
            <input className={inputClass} value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => set("status", e.target.value as FormState["status"])}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Categories" hint="Comma-separated category slugs. The first is the primary category.">
              <input
                className={inputClass}
                placeholder="feeding, bottles"
                value={form.categories}
                onChange={(e) => set("categories", e.target.value)}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-6 md:col-span-2">
            <Toggle label="Available (in stock)" checked={form.available} onChange={(v) => set("available", v)} />
            <Toggle label="Featured on homepage" checked={form.featured} onChange={(v) => set("featured", v)} />
          </div>
        </div>
      </Card>

      <Card title="Description">
        <div className="grid gap-4">
          <Field label="Short description">
            <textarea
              rows={2}
              className={inputClass}
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
            />
          </Field>
          <Field label="Full description">
            <textarea
              rows={8}
              className={inputClass}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card title="Pricing (PKR)">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Regular price">
            <input
              className={inputClass}
              inputMode="decimal"
              value={form.regularPrice}
              onChange={(e) => set("regularPrice", e.target.value)}
            />
          </Field>
          <Field label="Sale price" hint="Leave empty if not on sale.">
            <input
              className={inputClass}
              inputMode="decimal"
              value={form.salePrice}
              onChange={(e) => set("salePrice", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card title="Images & gallery">
        <GalleryPicker
          label="Product images"
          images={form.images}
          onChange={(images) => set("images", images)}
        />
      </Card>

      <Card title="SEO">
        <div className="grid gap-4">
          <Field label="SEO title">
            <input className={inputClass} value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
          </Field>
          <Field label="Meta description">
            <textarea
              rows={2}
              className={inputClass}
              value={form.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
            />
          </Field>
          <MediaPicker
            label="Social / Open Graph image"
            value={form.seoOgImage}
            onChange={({ src }) => set("seoOgImage", src)}
            allowClear
          />
        </div>
      </Card>
    </div>
  );
}
