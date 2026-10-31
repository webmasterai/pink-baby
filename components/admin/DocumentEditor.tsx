"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-fetch";

type DocResponse = {
  docKey: string;
  title: string;
  conflictToken: string;
  draftRevision: number;
  publishedRevision: number;
  payload: unknown;
  hasDraft: boolean;
  publishedAt: string | null;
};

export function DocumentEditor({
  docKey,
  heading,
  description,
}: {
  docKey: string;
  heading: string;
  description?: string;
}) {
  const [doc, setDoc] = useState<DocResponse | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    const res = await apiFetch(`/api/admin/cms/documents/${encodeURIComponent(docKey)}`);
    const data = (await res.json()) as DocResponse & { error?: string };
    if (!res.ok) {
      setError(data.error || "Failed to load");
      return;
    }
    setDoc(data);
    setText(JSON.stringify(data.payload, null, 2));
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

  async function saveDraft() {
    if (!doc) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const payload = JSON.parse(text) as unknown;
      const res = await apiFetch(`/api/admin/cms/documents/${encodeURIComponent(docKey)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          conflictToken: doc.conflictToken,
          title: doc.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setOk("Draft saved.");
      setDirty(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!doc) return;
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
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conflictToken: doc.conflictToken }),
        },
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{heading}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          {doc ? (
            <p className="mt-2 text-xs text-slate-400">
              Draft r{doc.draftRevision} · Published r{doc.publishedRevision}
              {doc.hasDraft ? " · Unpublished draft present" : ""}
              {doc.publishedAt ? ` · Last published ${new Date(doc.publishedAt).toLocaleString()}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
            href={`/admin/preview?doc=${encodeURIComponent(docKey)}`}
            target="_blank"
            rel="noreferrer"
          >
            Preview
          </a>
          <button
            type="button"
            disabled={busy || !dirty}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={() => void saveDraft()}
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-pb-pink px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() => void publish()}
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

      <label className="block text-sm font-semibold text-slate-700">
        Structured content
        <span className="mt-1 block text-xs font-normal text-slate-500">
          Edit fields as structured data. Do not paste scripts or HTML/JS. Invalid JSON will not save.
        </span>
        <textarea
          className="mt-2 min-h-[28rem] w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs leading-5"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setDirty(true);
          }}
          spellCheck={false}
        />
      </label>
    </div>
  );
}
