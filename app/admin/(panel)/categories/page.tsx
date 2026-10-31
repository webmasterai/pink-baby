"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/admin/StructuredDocForm";
import {
  btnPrimary,
  btnSecondary,
  btnSmall,
  Card,
  Loading,
  Notice,
  PageHead,
  readJson,
  tableWrap,
  tdClass,
  thClass,
  Toggle,
  useAdminResource,
} from "@/components/admin/AdminUi";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { apiFetch } from "@/lib/client-fetch";
import type { CategoryRecord } from "@/lib/cms/types";

type CategorySummary = { slug: string; name: string; count: number };

type EditState = {
  isNew: boolean;
  id?: string;
  slug: string;
  name: string;
  displayName: string;
  parentSlug: string;
  visible: boolean;
  navOrder: string;
  image: string;
  description: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function blank(): EditState {
  return {
    isNew: true,
    slug: "",
    name: "",
    displayName: "",
    parentSlug: "",
    visible: true,
    navOrder: "0",
    image: "",
    description: "",
  };
}

export default function AdminCategoriesPage() {
  const cats = useAdminResource<{ categories: CategoryRecord[] }>("/api/admin/cms/categories");
  const summary = useAdminResource<{ categories: CategorySummary[] }>("/api/admin/cms/products");
  const [edit, setEdit] = useState<EditState | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const counts = new Map((summary.data?.categories || []).map((c) => [c.slug, c.count]));
  // Fall back to the product summary list when the categories API is not available.
  const records: Partial<CategoryRecord>[] =
    cats.data?.categories ||
    (summary.data?.categories || []).map((c) => ({
      slug: c.slug,
      name: c.name,
      displayName: c.name,
    }));
  const readOnly = !cats.data;

  function startEdit(c: Partial<CategoryRecord>) {
    setErr(null);
    setMsg(null);
    setEdit({
      isNew: false,
      id: c.id,
      slug: c.slug || "",
      name: c.name || "",
      displayName: c.displayName || c.name || "",
      parentSlug: c.parentSlug || "",
      visible: c.visible !== false,
      navOrder: String(c.navOrder ?? 0),
      image: c.image || "",
      description: c.description || "",
    });
  }

  async function save() {
    if (!edit) return;
    setErr(null);
    setMsg(null);
    const slug = slugify(edit.slug);
    if (!slug || !edit.displayName.trim()) {
      setErr("Slug and display name are required.");
      return;
    }
    const existing = cats.data?.categories.find((c) => c.slug === slug);
    if (edit.isNew && existing) {
      setErr("A category with this slug already exists.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch("/api/admin/cms/categories", {
        method: edit.isNew ? "POST" : "PUT",
        json: {
          ...(existing ? { id: existing.id } : {}),
          slug,
          name: edit.name.trim() || edit.displayName.trim(),
          displayName: edit.displayName.trim(),
          parentSlug: edit.parentSlug || null,
          visible: edit.visible,
          navOrder: Number(edit.navOrder) || 0,
          image: edit.image.trim(),
          description: edit.description,
        },
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg("Category saved.");
      setEdit(null);
      await Promise.all([cats.reload(), summary.reload()]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const loading = (cats.loading || summary.loading) && !cats.data && !summary.data;

  return (
    <div className="space-y-5">
      <PageHead
        title="Categories & subcategories"
        description="Product counts include published products only."
        actions={
          <button
            type="button"
            className={btnPrimary}
            disabled={readOnly}
            onClick={() => {
              setErr(null);
              setMsg(null);
              setEdit(blank());
            }}
          >
            + New category
          </button>
        }
      />
      <Notice error={err || cats.error} ok={msg} />
      {cats.missing ? (
        <Notice info="The categories API (/api/admin/cms/categories) is not available yet — showing a read-only list with counts from the products API." />
      ) : null}

      {loading ? (
        <Loading />
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className={thClass}>Name</th>
                <th className={thClass}>Slug</th>
                <th className={thClass}>Parent</th>
                <th className={thClass}>Order</th>
                <th className={thClass}>Visible</th>
                <th className={thClass}>Products</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td className={tdClass} colSpan={7}>
                    No categories.
                  </td>
                </tr>
              ) : (
                records.map((c) => (
                  <tr key={c.slug}>
                    <td className={`${tdClass} font-semibold`}>
                      <div className="flex items-center gap-3">
                        {c.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.image}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-cover"
                          />
                        ) : (
                          <span className="h-10 w-10 shrink-0 rounded-lg border border-dashed border-slate-300 bg-slate-50" />
                        )}
                        <span>{c.displayName || c.name}</span>
                      </div>
                    </td>
                    <td className={tdClass}>{c.slug}</td>
                    <td className={tdClass}>{c.parentSlug || "—"}</td>
                    <td className={tdClass}>{c.navOrder ?? "—"}</td>
                    <td className={tdClass}>{c.visible === undefined ? "—" : c.visible ? "Yes" : "No"}</td>
                    <td className={tdClass}>{counts.get(c.slug || "") ?? 0}</td>
                    <td className={`${tdClass} text-right`}>
                      <button
                        type="button"
                        className={`${btnSecondary} ${btnSmall}`}
                        disabled={readOnly}
                        onClick={() => startEdit(c)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {edit ? (
        <Card title={edit.isNew ? "New category" : `Edit: ${edit.displayName}`}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Display name">
              <input
                className={inputClass}
                value={edit.displayName}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    displayName: e.target.value,
                    name: edit.isNew && !edit.name ? e.target.value : edit.name,
                    slug: edit.isNew && !edit.slug ? slugify(e.target.value) : edit.slug,
                  })
                }
              />
            </Field>
            <Field label="Name">
              <input
                className={inputClass}
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </Field>
            <Field label="Slug" hint={edit.isNew ? "Cannot be changed after creation." : "Slug is fixed for existing categories."}>
              <input
                className={inputClass}
                value={edit.slug}
                readOnly={!edit.isNew}
                onChange={(e) => setEdit({ ...edit, slug: e.target.value })}
              />
            </Field>
            <Field label="Parent category">
              <select
                className={inputClass}
                value={edit.parentSlug}
                onChange={(e) => setEdit({ ...edit, parentSlug: e.target.value })}
              >
                <option value="">None (top level)</option>
                {records
                  .filter((c) => c.slug !== edit.slug)
                  .map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.displayName || c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Navigation order">
              <input
                type="number"
                className={inputClass}
                value={edit.navOrder}
                onChange={(e) => setEdit({ ...edit, navOrder: e.target.value })}
              />
            </Field>
            <div className="md:col-span-2">
              <MediaPicker
                label="Category image"
                value={edit.image}
                alt={edit.displayName}
                onChange={({ src }) => setEdit({ ...edit, image: src })}
              />
            </div>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={edit.description}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                />
              </Field>
            </div>
            <Toggle
              label="Visible on storefront"
              checked={edit.visible}
              onChange={(visible) => setEdit({ ...edit, visible })}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" className={btnPrimary} disabled={busy} onClick={() => void save()}>
              Save category
            </button>
            <button type="button" className={btnSecondary} onClick={() => setEdit(null)}>
              Cancel
            </button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
