"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { apiFetch } from "@/lib/client-fetch";
import type { MediaAsset } from "@/lib/cms/types";
import { btnPrimary, btnSecondary, btnSmall, readJson } from "@/components/admin/AdminUi";
import { inputClass } from "@/components/admin/StructuredDocForm";

type Props = {
  label: string;
  value: string;
  alt?: string;
  onChange: (next: { src: string; alt?: string }) => void;
  allowClear?: boolean;
  hint?: string;
};

function Preview({ src, alt }: { src: string; alt?: string }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!src) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
        No image selected
      </div>
    );
  }
  if (broken) {
    return (
      <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-center text-xs text-red-700">
        <span>Could not load image</span>
        <span className="break-all opacity-70">{src}</span>
      </div>
    );
  }
  return (
    <div className="relative h-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || ""}
        className="h-full w-full object-contain"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

export function MediaPicker({
  label,
  value,
  alt = "",
  onChange,
  allowClear = true,
  hint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  async function loadLibrary() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/api/admin/cms/media${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`,
      );
      const data = await readJson<{ media?: MediaAsset[] }>(res);
      if (!res.ok) throw new Error(data.error || "Could not load media");
      setAssets(data.media || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load media");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("alt", alt || file.name);
      const res = await apiFetch("/api/admin/cms/media", {
        method: "POST",
        body: form,
      });
      const data = await readJson<{ media?: MediaAsset }>(res);
      if (!res.ok || !data.media) throw new Error(data.error || "Upload failed");
      onChange({ src: data.media.path, alt: data.media.alt || alt });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </div>
      <Preview src={value} alt={alt} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={() => setOpen(true)}>
          Choose from library
        </button>
        <button
          type="button"
          className={`${btnSecondary} ${btnSmall}`}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : value ? "Replace / upload" : "Upload new"}
        </button>
        {allowClear && value ? (
          <button
            type="button"
            className={`${btnSecondary} ${btnSmall}`}
            onClick={() => onChange({ src: "", alt })}
          >
            Remove
          </button>
        ) : null}
        <button
          type="button"
          className="text-xs font-semibold text-slate-500 underline"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? "Hide path" : "Advanced path"}
        </button>
      </div>
      <label className="block text-xs font-semibold text-slate-600">
        Alt text
        <input
          className={`${inputClass} mt-1`}
          value={alt}
          onChange={(e) => onChange({ src: value, alt: e.target.value })}
          placeholder="Describe the image for accessibility"
        />
      </label>
      {showAdvanced ? (
        <label className="block text-xs font-semibold text-slate-500">
          Image path / URL
          <input
            className={`${inputClass} mt-1 font-mono text-xs`}
            value={value}
            onChange={(e) => onChange({ src: e.target.value, alt })}
          />
        </label>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      {open ? (
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex max-h-[85dvh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 id={titleId} className="font-display text-lg font-bold">
                Media library
              </h3>
              <button type="button" className="text-sm font-semibold" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <div className="flex gap-2 border-b border-slate-100 px-4 py-3">
              <input
                className={inputClass}
                placeholder="Search files…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void loadLibrary();
                  }
                }}
              />
              <button type="button" className={btnSecondary} onClick={() => void loadLibrary()}>
                Search
              </button>
              <button
                type="button"
                className={btnPrimary}
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                Upload
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : assets.length === 0 ? (
                <p className="text-sm text-slate-500">No media found. Upload an image to begin.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {assets.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        className={`w-full overflow-hidden rounded-xl border text-left transition hover:border-pb-pink ${
                          value === a.path ? "border-pb-pink ring-2 ring-pb-pink/30" : "border-slate-200"
                        }`}
                        onClick={() => {
                          onChange({ src: a.path, alt: a.alt || alt });
                          setOpen(false);
                        }}
                      >
                        <div className="relative aspect-square bg-slate-50">
                          {a.mime.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.path} alt={a.alt || a.filename} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs">File</div>
                          )}
                        </div>
                        <p className="truncate px-2 py-1.5 text-[11px] text-slate-600">{a.filename}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function GalleryPicker({
  label,
  images,
  onChange,
}: {
  label: string;
  images: { src: string; alt: string }[];
  onChange: (images: { src: string; alt: string }[]) => void;
}) {
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <ul className="space-y-3">
        {images.map((img, i) => (
          <li key={`${img.src}-${i}`} className="rounded-xl border border-slate-200 p-3">
            <MediaPicker
              label={i === 0 ? "Main image" : `Gallery image ${i + 1}`}
              value={img.src}
              alt={img.alt}
              onChange={({ src, alt: nextAlt }) => {
                const next = [...images];
                next[i] = { src, alt: nextAlt || "" };
                onChange(next.filter((x) => x.src));
              }}
              allowClear
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={`${btnSecondary} ${btnSmall}`} disabled={i === 0} onClick={() => move(i, -1)}>
                Move up
              </button>
              <button
                type="button"
                className={`${btnSecondary} ${btnSmall}`}
                disabled={i === images.length - 1}
                onClick={() => move(i, 1)}
              >
                Move down
              </button>
              {i > 0 ? (
                <button
                  type="button"
                  className={`${btnSecondary} ${btnSmall}`}
                  onClick={() => {
                    const next = [...images];
                    const [item] = next.splice(i, 1);
                    if (item) next.unshift(item);
                    onChange(next);
                  }}
                >
                  Set as main
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={btnSecondary}
        onClick={() => onChange([...images, { src: "", alt: "" }])}
      >
        + Add gallery image
      </button>
    </div>
  );
}

const ICONS = [
  { id: "heart", label: "Heart" },
  { id: "hand", label: "Hand" },
  { id: "truck", label: "Truck" },
] as const;

export function IconPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-700">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {ICONS.map((icon) => (
          <button
            key={icon.id}
            type="button"
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
              value === icon.id
                ? "border-pb-pink bg-pb-blush text-pb-pink"
                : "border-slate-200 bg-white text-slate-700 hover:border-pb-pink"
            }`}
            onClick={() => onChange(icon.id)}
            aria-pressed={value === icon.id}
          >
            {icon.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
