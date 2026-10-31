"use client";

import { useState } from "react";
import {
  btnDanger,
  btnPrimary,
  btnSmall,
  Card,
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

type Backup = { name: string; size: number; createdAt: string };

function formatSize(n: number) {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

export default function AdminBackupPage() {
  const { data, error, loading, missing, reload } = useAdminResource<{ backups?: Backup[] }>(
    "/api/admin/cms/backup",
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const backups = data?.backups || [];

  async function run(body: { action: "create" } | { action: "restore"; name: string }) {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await apiFetch("/api/admin/cms/backup", { method: "POST", json: body });
      const d = await readJson<{ requiresRestart?: boolean; name?: string }>(res);
      if (!res.ok) throw new Error(d.error || "Request failed");
      setMsg(
        body.action === "create"
          ? `Backup created${d.name ? `: ${d.name}` : ""}.`
          : `Backup restored.${d.requiresRestart ? " Restart the server to apply it fully." : ""}`,
      );
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHead
        title="Backup & restore"
        description="Snapshots of the CMS database. Restoring takes a safety backup first."
        actions={
          <button
            type="button"
            className={btnPrimary}
            disabled={busy || missing}
            onClick={() => void run({ action: "create" })}
          >
            Create backup
          </button>
        }
      />
      <Card>
        <p className="text-sm text-slate-600">
          Restoring replaces current content, products and orders with the selected snapshot. The
          server must be restarted afterwards for a fully consistent state. Uploaded media files
          are not included in database backups.
        </p>
      </Card>
      <Notice error={err || error} ok={msg} />
      {missing ? <Notice info="The backup API (/api/admin/cms/backup) is not available yet." /> : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[480px]">
            <thead>
              <tr>
                <th className={thClass}>Backup</th>
                <th className={thClass}>Created</th>
                <th className={thClass}>Size</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td className={tdClass} colSpan={4}>
                    No backups yet.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.name}>
                    <td className={`${tdClass} font-mono text-xs`}>{b.name}</td>
                    <td className={tdClass}>{formatDate(b.createdAt)}</td>
                    <td className={tdClass}>{formatSize(b.size)}</td>
                    <td className={`${tdClass} text-right`}>
                      <button
                        type="button"
                        className={`${btnDanger} ${btnSmall}`}
                        disabled={busy}
                        onClick={() => {
                          if (
                            confirm(
                              `Restore ${b.name}? Current data will be replaced (a safety backup is created first).`,
                            )
                          ) {
                            void run({ action: "restore", name: b.name });
                          }
                        }}
                      >
                        Restore
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
  );
}
