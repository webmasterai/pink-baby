"use client";

import {
  btnSecondary,
  formatDate,
  Loading,
  Notice,
  PageHead,
  tableWrap,
  tdClass,
  thClass,
  useAdminResource,
} from "@/components/admin/AdminUi";

type AuditEntry = {
  id: string;
  actorId: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  meta?: Record<string, unknown>;
  createdAt: string;
};

export default function AdminAuditPage() {
  const { data, error, loading, missing, reload } = useAdminResource<{
    entries?: AuditEntry[];
    audit?: AuditEntry[];
  }>("/api/admin/cms/audit");
  const entries = data?.entries || data?.audit || [];

  return (
    <div className="space-y-5">
      <PageHead
        title="Audit history"
        description="Recent changes made by staff. Secrets are never recorded."
        actions={
          <button type="button" className={btnSecondary} onClick={() => void reload()}>
            Refresh
          </button>
        }
      />
      <Notice error={error} />
      {missing ? <Notice info="The audit API (/api/admin/cms/audit) is not available yet." /> : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[720px]">
            <thead>
              <tr>
                <th className={thClass}>When</th>
                <th className={thClass}>Actor</th>
                <th className={thClass}>Action</th>
                <th className={thClass}>Entity</th>
                <th className={thClass}>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td className={tdClass} colSpan={5}>
                    No audit entries.
                  </td>
                </tr>
              ) : (
                entries.map((a) => (
                  <tr key={a.id}>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatDate(a.createdAt)}</td>
                    <td className={tdClass}>{a.actorName || a.actorEmail || a.actorId || "system"}</td>
                    <td className={`${tdClass} font-semibold`}>{a.action}</td>
                    <td className={tdClass}>
                      {a.entityType}
                      {a.entityId ? <span className="text-slate-400"> · {a.entityId}</span> : null}
                    </td>
                    <td className={`${tdClass} max-w-xs break-words text-xs text-slate-500`}>
                      {a.meta && Object.keys(a.meta).length ? JSON.stringify(a.meta) : "—"}
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
