"use client";

import { useRef, useState } from "react";
import { inputClass } from "@/components/admin/StructuredDocForm";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  btnSmall,
  Card,
  Loading,
  Notice,
  PageHead,
  readJson,
  useAdminResource,
} from "@/components/admin/AdminUi";
import { apiFetch } from "@/lib/client-fetch";
import type { MediaAsset } from "@/lib/cms/types";

function MediaCard({
  asset,
  onChanged,
  onError,
  onOk,
}: {
  asset: MediaAsset;
  onChanged: () => void;
  onError: (m: string | null) => void;
  onOk: (m: string | null) => void;
}) {
  const [alt, setAlt] = useState(asset.alt);
  const [busy, setBusy] = useState(false);
  const isImage = asset.mime.startsWith("image/");

  async function saveAlt() {
    setBusy(true);
    onError(null);
    onOk(null);
    try {
      const res = await apiFetch(`/api/admin/cms/media/${encodeURIComponent(asset.id)}`, {
        method: "PUT",
        json: { alt },
      });
      const d = await readJson(res);
      if (!res.ok) throw new Error(d.error || "Could not save alt text");
      onOk("Alt text saved.");
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not save alt text");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete ${asset.filename}?`)) return;
    setBusy(true);
    onError(null);
    onOk(null);
    try {
      let res = await apiFetch(`/api/admin/cms/media/${encodeURIComponent(asset.id)}`, {
        method: "DELETE",
      });
      let d = await readJson<{ usage?: string[] }>(res);
      if (res.status === 409) {
        const where = d.usage?.length ? `\n\nUsed in: ${d.usage.join(", ")}` : "";
        if (!confirm(`${d.error || "This file is in use."}${where}\n\nDelete anyway?`)) return;
        res = await apiFetch(`/api/admin/cms/media/${encodeURIComponent(asset.id)}?force=1`, {
          method: "DELETE",
        });
        d = await readJson(res);
      }
      if (!res.ok) throw new Error(d.error || "Could not delete file");
      onOk("File deleted.");
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not delete file");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex h-36 items-center justify-center bg-slate-50">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.path} alt={asset.alt} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-slate-400">{asset.mime}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-xs font-semibold text-slate-700" title={asset.filename}>
          {asset.filename}
        </p>
        <input
          className={inputClass}
          placeholder="Alt text"
          aria-label={`Alt text for ${asset.filename}`}
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className={`${btnSecondary} ${btnSmall}`}
            onClick={() => void navigator.clipboard?.writeText(asset.path)}
          >
            Copy URL
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className={`${btnPrimary} ${btnSmall}`}
              disabled={busy || alt === asset.alt}
              onClick={() => void saveAlt()}
            >
              Save
            </button>
            <button
              type="button"
              className={`${btnDanger} ${btnSmall}`}
              disabled={busy}
              onClick={() => void remove()}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminMediaPage() {
  const { data, error, loading, missing, reload } = useAdminResource<{ media?: MediaAsset[] }>(
    "/api/admin/cms/media",
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const media = data?.media || [];

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErr(null);
    setMsg(null);
    let okCount = 0;
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await apiFetch("/api/admin/cms/media", { method: "POST", body: form });
        const d = await readJson(res);
        if (!res.ok) throw new Error(`${file.name}: ${d.error || "Upload failed"}`);
        okCount += 1;
      }
      setMsg(`${okCount} file(s) uploaded.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      await reload();
    }
  }

  return (
    <div className="space-y-5">
      <PageHead title="Media library" description="Upload images and manage alt text." />
      <Card title="Upload">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          aria-label="Upload files"
          disabled={uploading || missing}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-pb-pink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          onChange={(e) => void upload(e.target.files)}
        />
        {uploading ? <p className="mt-2 text-sm text-slate-500">Uploading…</p> : null}
      </Card>
      <Notice error={err || error} ok={msg} />
      {missing ? <Notice info="The media API (/api/admin/cms/media) is not available yet." /> : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.length === 0 ? <p className="text-sm text-slate-500">No media uploaded yet.</p> : null}
          {media.map((m) => (
            <MediaCard
              key={m.id}
              asset={m}
              onChanged={() => void reload()}
              onError={setErr}
              onOk={setMsg}
            />
          ))}
        </div>
      )}
    </div>
  );
}
