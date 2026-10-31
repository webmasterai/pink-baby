"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-fetch";

type DocMeta = {
  conflictToken: string;
  draftRevision: number;
  publishedRevision: number;
  hasDraft: boolean;
  publishedAt: string | null;
  title: string;
};

export function useCmsDocument<T>(docKey: string) {
  const [payload, setPayload] = useState<T | null>(null);
  const [meta, setMeta] = useState<DocMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    const res = await apiFetch(`/api/admin/cms/documents/${encodeURIComponent(docKey)}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load");
      return;
    }
    setPayload(data.payload as T);
    setMeta({
      conflictToken: data.conflictToken,
      draftRevision: data.draftRevision,
      publishedRevision: data.publishedRevision,
      hasDraft: data.hasDraft,
      publishedAt: data.publishedAt,
      title: data.title,
    });
    setDirty(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function update(next: T) {
    setPayload(next);
    setDirty(true);
  }

  async function saveDraft() {
    if (!meta || payload == null) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await apiFetch(`/api/admin/cms/documents/${encodeURIComponent(docKey)}`, {
        method: "PUT",
        json: { payload, conflictToken: meta.conflictToken, title: meta.title },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setOk("Draft saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!meta) return;
    if (dirty) {
      setError("Save draft before publishing.");
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await apiFetch(
        `/api/admin/cms/documents/${encodeURIComponent(docKey)}/publish`,
        { method: "POST", json: { conflictToken: meta.conflictToken } },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");
      setOk("Published to the storefront.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  return {
    payload,
    meta,
    error,
    ok,
    dirty,
    busy,
    update,
    saveDraft,
    publish,
    reload: load,
  };
}

export function DocToolbar({
  title,
  description,
  meta,
  dirty,
  busy,
  error,
  ok,
  onSave,
  onPublish,
  previewHref,
}: {
  title: string;
  description?: string;
  meta: DocMeta | null;
  dirty: boolean;
  busy: boolean;
  error: string | null;
  ok: string | null;
  onSave: () => void;
  onPublish: () => void;
  previewHref?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          {meta ? (
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <p>
                Draft r{meta.draftRevision} · Published r{meta.publishedRevision}
                {meta.publishedAt
                  ? ` · Live since ${new Date(meta.publishedAt).toLocaleString()}`
                  : ""}
              </p>
              {dirty ? (
                <p className="font-semibold text-amber-700">Unsaved changes on this screen.</p>
              ) : null}
              {meta.hasDraft ? (
                <p className="font-semibold text-pb-pink">
                  A saved draft differs from the live published version. Preview uses the draft;
                  Publish replaces the live site content.
                </p>
              ) : (
                <p>Editing matches the live published content (until you change and save a draft).</p>
              )}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {previewHref ? (
            <a
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
            >
              Preview draft
            </a>
          ) : null}
          <button
            type="button"
            disabled={busy || !dirty}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={onSave}
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-pb-pink px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={onPublish}
          >
            Publish
          </button>
        </div>
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</p>
      ) : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {hint ? <span className="mt-0.5 block text-xs font-normal text-slate-500">{hint}</span> : null}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900";
