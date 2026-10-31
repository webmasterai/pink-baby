"use client";

import { useEffect, useState } from "react";
import { Field, inputClass } from "@/components/admin/StructuredDocForm";
import {
  btnPrimary,
  btnSmall,
  Card,
  formatDate,
  Loading,
  Notice,
  PageHead,
  readJson,
  useAdminResource,
} from "@/components/admin/AdminUi";
import { apiFetch } from "@/lib/client-fetch";
import type { EnquiryRecord } from "@/lib/cms/types";

function EnquiryCard({ enquiry, onSaved }: { enquiry: EnquiryRecord; onSaved: () => void }) {
  const [status, setStatus] = useState(enquiry.status);
  const [notes, setNotes] = useState(enquiry.notes);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const dirty = status !== enquiry.status || notes !== enquiry.notes;

  async function save() {
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const res = await apiFetch(`/api/admin/cms/enquiries/${encodeURIComponent(enquiry.id)}`, {
        method: "PUT",
        json: { status, notes },
      });
      const d = await readJson(res);
      if (!res.ok) throw new Error(d.error || "Save failed");
      setOk("Saved.");
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">{enquiry.name}</p>
          <p className="text-xs text-slate-500">
            <a href={`mailto:${enquiry.email}`} className="hover:text-pb-pink">
              {enquiry.email}
            </a>{" "}
            · {enquiry.source} · {formatDate(enquiry.createdAt)}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-600">
          {enquiry.status}
        </span>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{enquiry.message}</p>
      <div className="mt-4 grid items-end gap-3 md:grid-cols-[10rem_1fr_auto]">
        <Field label="Status">
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as EnquiryRecord["status"])}
          >
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <Field label="Internal notes">
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <button
          type="button"
          className={`${btnPrimary} ${btnSmall} mb-1`}
          disabled={busy || !dirty}
          onClick={() => void save()}
        >
          Save
        </button>
      </div>
      <div className="mt-2 space-y-2">
        <Notice error={err} ok={ok} />
      </div>
    </Card>
  );
}

export default function AdminEnquiriesPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (debounced) params.set("q", debounced);
  const { data, error, loading, missing, reload } = useAdminResource<{
    enquiries?: EnquiryRecord[];
  }>(`/api/admin/cms/enquiries?${params.toString()}`);
  const enquiries = data?.enquiries || [];

  return (
    <div className="space-y-5">
      <PageHead title="Enquiries" description="Messages from the contact form." />
      <div className="flex flex-wrap gap-3">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Search name, email or message…"
          aria-label="Search enquiries"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={`${inputClass} !w-40`}
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <Notice error={error} />
      {missing ? (
        <Notice info="The enquiries API (/api/admin/cms/enquiries) is not available yet." />
      ) : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <div className="space-y-3">
          {enquiries.length === 0 ? <p className="text-sm text-slate-500">No enquiries found.</p> : null}
          {enquiries.map((e) => (
            <EnquiryCard key={e.id + e.updatedAt} enquiry={e} onSaved={() => void reload()} />
          ))}
        </div>
      )}
    </div>
  );
}

