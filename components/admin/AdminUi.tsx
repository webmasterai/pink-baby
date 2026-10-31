"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/client-fetch";

export const btnPrimary =
  "rounded-lg bg-pb-pink px-3 py-2 text-sm font-semibold text-white disabled:opacity-50";
export const btnSecondary =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50";
export const btnDanger =
  "rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-50";
export const btnSmall = "px-2.5 py-1 text-xs";

export function Card({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      {title || actions ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title ? <h3 className="text-base font-bold text-slate-900">{title}</h3> : null}
            {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
          </div>
          {actions ? <div className="flex gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function PageHead({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Notice({
  error,
  ok,
  info,
}: {
  error?: string | null;
  ok?: string | null;
  info?: string | null;
}) {
  return (
    <>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</p>
      ) : null}
      {info ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{info}</p>
      ) : null}
    </>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p className="text-sm text-slate-500">{label}</p>;
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 accent-pink-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export const tableWrap = "overflow-x-auto rounded-xl border border-slate-200 bg-white";
export const thClass =
  "border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
export const tdClass = "border-b border-slate-100 px-3 py-2 text-sm text-slate-800 align-top";

/** Safe JSON parse of a fetch Response (never throws). */
export async function readJson<T = Record<string, unknown>>(
  res: Response,
): Promise<T & { error?: string }> {
  try {
    return (await res.json()) as T & { error?: string };
  } catch {
    return { error: res.ok ? undefined : `Request failed (${res.status})` } as T & {
      error?: string;
    };
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

/** Loads JSON from an admin API URL; exposes data, error, loading and reload. */
export function useAdminResource<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setMissing(false);
    try {
      const res = await apiFetch(url);
      const json = await readJson<T>(res);
      if (res.status === 404 || res.status === 405) {
        setMissing(true);
        setData(null);
      } else if (!res.ok) {
        setError(json.error || `Request failed (${res.status})`);
        setData(null);
      } else {
        setData(json as T);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { data, error, loading, missing, reload: load, setData };
}


