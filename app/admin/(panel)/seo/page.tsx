"use client";

import { useState } from "react";
import {
  DocToolbar,
  Field,
  inputClass,
  useCmsDocument,
} from "@/components/admin/StructuredDocForm";
import {
  btnDanger,
  btnPrimary,
  btnSmall,
  Card,
  Loading,
  Notice,
  readJson,
  tableWrap,
  tdClass,
  thClass,
  useAdminResource,
} from "@/components/admin/AdminUi";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { apiFetch } from "@/lib/client-fetch";

type SeoDefaultsPayload = {
  titleTemplate: string;
  defaultDescription: string;
  defaultOgImage: string;
  twitterHandle: string;
};

type Redirect = { id?: string; from: string; to: string; status?: number };

export default function AdminSeoPage() {
  const doc = useCmsDocument<SeoDefaultsPayload>("seo_defaults");
  const p = doc.payload;
  const redirects = useAdminResource<{ redirects?: Redirect[] }>("/api/admin/cms/redirects");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("301");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const list = redirects.data?.redirects || [];

  async function add() {
    setErr(null);
    setMsg(null);
    if (!from.startsWith("/") || !to.trim()) {
      setErr('"From" must start with "/" and "To" is required.');
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch("/api/admin/cms/redirects", {
        method: "POST",
        json: { from: from.trim(), to: to.trim(), status: Number(status) },
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not add redirect");
      setFrom("");
      setTo("");
      setMsg("Redirect added.");
      await redirects.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not add redirect");
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: Redirect) {
    if (!r.id || !confirm(`Delete redirect ${r.from}?`)) return;
    setErr(null);
    setMsg(null);
    const res = await apiFetch(`/api/admin/cms/redirects/${encodeURIComponent(r.id)}`, {
      method: "DELETE",
    });
    const data = await readJson(res);
    if (!res.ok) {
      setErr(data.error || "Could not delete redirect");
      return;
    }
    setMsg("Redirect deleted.");
    await redirects.reload();
  }

  return (
    <div className="space-y-5">
      <DocToolbar
        title="SEO & redirects"
        description="Default meta tags and URL redirects."
        meta={doc.meta}
        dirty={doc.dirty}
        busy={doc.busy}
        error={doc.error}
        ok={doc.ok}
        onSave={doc.saveDraft}
        onPublish={doc.publish}
      />

      {!p ? (
        doc.error ? null : <Loading />
      ) : (
        <Card title="SEO defaults">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title template" hint="Use %s where the page title goes.">
              <input
                className={inputClass}
                value={p.titleTemplate}
                onChange={(e) => doc.update({ ...p, titleTemplate: e.target.value })}
              />
            </Field>
            <Field label="Twitter / X handle">
              <input
                className={inputClass}
                value={p.twitterHandle}
                onChange={(e) => doc.update({ ...p, twitterHandle: e.target.value })}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Default meta description">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={p.defaultDescription}
                  onChange={(e) => doc.update({ ...p, defaultDescription: e.target.value })}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <MediaPicker
                label="Default Open Graph image"
                value={p.defaultOgImage}
                alt="Default social sharing image"
                onChange={({ src }) => doc.update({ ...p, defaultOgImage: src })}
              />
            </div>
          </div>
        </Card>
      )}

      <Card title="Redirects" description="Send old URLs to new ones.">
        <div className="space-y-3">
          <Notice error={err} ok={msg} />
          {redirects.missing ? (
            <Notice info="The redirects API (/api/admin/cms/redirects) is not available yet. Redirect management will work once the endpoint is added." />
          ) : null}
          <Notice error={redirects.error} />
          <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_7rem_auto]">
            <Field label="From path">
              <input
                className={inputClass}
                placeholder="/old-page"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Field>
            <Field label="To path or URL">
              <input
                className={inputClass}
                placeholder="/new-page"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </Field>
            <Field label="Type">
              <select
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="301">301 permanent</option>
                <option value="302">302 temporary</option>
              </select>
            </Field>
            <button
              type="button"
              className={`${btnPrimary} mb-0.5`}
              disabled={busy || redirects.missing}
              onClick={() => void add()}
            >
              Add redirect
            </button>
          </div>

          {redirects.loading ? (
            <Loading />
          ) : (
            <div className={tableWrap}>
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr>
                    <th className={thClass}>From</th>
                    <th className={thClass}>To</th>
                    <th className={thClass}>Type</th>
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td className={tdClass} colSpan={4}>
                        No redirects.
                      </td>
                    </tr>
                  ) : (
                    list.map((r, i) => (
                      <tr key={r.id || `${r.from}-${i}`}>
                        <td className={tdClass}>{r.from}</td>
                        <td className={tdClass}>{r.to}</td>
                        <td className={tdClass}>{r.status ?? 301}</td>
                        <td className={`${tdClass} text-right`}>
                          <button
                            type="button"
                            className={`${btnDanger} ${btnSmall}`}
                            disabled={!r.id}
                            onClick={() => void remove(r)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
