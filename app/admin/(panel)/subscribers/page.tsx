"use client";

import { useState } from "react";
import { inputClass } from "@/components/admin/StructuredDocForm";
import {
  btnDanger,
  btnSecondary,
  btnSmall,
  formatDate,
  Loading,
  Notice,
  PageHead,
  readJson,
  tableWrap,
  tdClass,
  thClass,
  useAdminResource,
} from "@/components/admin/AdminUi";
import { apiFetch } from "@/lib/client-fetch";
import type { SubscriberRecord } from "@/lib/cms/types";

export default function AdminSubscribersPage() {
  const { data, error, loading, missing, reload } = useAdminResource<{
    subscribers?: SubscriberRecord[];
  }>("/api/admin/cms/subscribers");
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const needle = q.trim().toLowerCase();
  const subscribers = (data?.subscribers || []).filter(
    (s) => !needle || s.email.toLowerCase().includes(needle),
  );

  function csvCell(raw: string) {
    // Neutralise spreadsheet formula injection.
    const v = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }

  function exportCsv() {
    const rows = [
      ["email", "status", "source", "consentAt", "createdAt"],
      ...subscribers.map((s) => [s.email, s.status, s.source, s.consentAt, s.createdAt]),
    ];
    const csv = rows.map((r) => r.map((c) => csvCell(String(c ?? ""))).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function unsubscribe(s: SubscriberRecord) {
    if (!confirm(`Unsubscribe ${s.email}?`)) return;
    setErr(null);
    setMsg(null);
    try {
      const res = await apiFetch(`/api/admin/cms/subscribers/${encodeURIComponent(s.id)}`, {
        method: "PUT",
        json: { status: "unsubscribed" },
      });
      const d = await readJson(res);
      if (!res.ok) throw new Error(d.error || "Update failed");
      setMsg(`${s.email} unsubscribed.`);
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div className="space-y-5">
      <PageHead
        title="Newsletter subscribers"
        actions={
          <button
            type="button"
            className={btnSecondary}
            disabled={subscribers.length === 0}
            onClick={exportCsv}
          >
            Export CSV
          </button>
        }
      />
      <input
        className={`${inputClass} max-w-xs`}
        placeholder="Search email…"
        aria-label="Search subscribers"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Notice error={err || error} ok={msg} />
      {missing ? (
        <Notice info="The subscribers API (/api/admin/cms/subscribers) is not available yet." />
      ) : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                <th className={thClass}>Email</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Source</th>
                <th className={thClass}>Subscribed</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td className={tdClass} colSpan={5}>
                    No subscribers.
                  </td>
                </tr>
              ) : (
                subscribers.map((s) => (
                  <tr key={s.id}>
                    <td className={`${tdClass} font-semibold`}>{s.email}</td>
                    <td className={`${tdClass} capitalize`}>{s.status}</td>
                    <td className={tdClass}>{s.source}</td>
                    <td className={tdClass}>{formatDate(s.consentAt || s.createdAt)}</td>
                    <td className={`${tdClass} text-right`}>
                      {s.status === "subscribed" ? (
                        <button
                          type="button"
                          className={`${btnDanger} ${btnSmall}`}
                          onClick={() => void unsubscribe(s)}
                        >
                          Unsubscribe
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
