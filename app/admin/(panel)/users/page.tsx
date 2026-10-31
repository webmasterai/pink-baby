"use client";

import { useState } from "react";
import { inputClass } from "@/components/admin/StructuredDocForm";
import {
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
import type { CmsRole } from "@/lib/cms/types";

type StaffUser = {
  id: string;
  name?: string;
  email: string;
  role: string;
  createdAt?: string;
};

const ROLES: { value: CmsRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "order_manager", label: "Order manager" },
  { value: "customer", label: "Customer (remove staff access)" },
];

export default function AdminUsersPage() {
  const { data, error, loading, missing, reload } = useAdminResource<{ users?: StaffUser[] }>(
    "/api/admin/cms/users",
  );
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const users = data?.users || [];

  async function changeRole(u: StaffUser, role: string) {
    if (role === u.role) return;
    if (!confirm(`Change ${u.email} to "${role}"?`)) return;
    setErr(null);
    setMsg(null);
    setBusyId(u.id);
    try {
      const res = await apiFetch(`/api/admin/cms/users/${encodeURIComponent(u.id)}`, {
        method: "PUT",
        json: { role },
      });
      const d = await readJson(res);
      if (!res.ok) throw new Error(d.error || "Could not change role");
      setMsg(`Role updated for ${u.email}.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not change role");
    } finally {
      setBusyId(null);
      await reload();
    }
  }

  return (
    <div className="space-y-5">
      <PageHead
        title="Admin users & roles"
        description="Owner and Admin have full access; Editor manages content; Order manager handles orders, customers and enquiries."
      />
      <Notice error={err || error} ok={msg} />
      {missing ? <Notice info="The users API (/api/admin/cms/users) is not available yet." /> : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                <th className={thClass}>Name</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td className={tdClass} colSpan={4}>
                    No staff users.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className={`${tdClass} font-semibold`}>{u.name || "—"}</td>
                    <td className={tdClass}>{u.email}</td>
                    <td className={tdClass}>
                      <select
                        className={`${inputClass} !w-56`}
                        aria-label={`Role for ${u.email}`}
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={(e) => void changeRole(u, e.target.value)}
                      >
                        {!ROLES.some((r) => r.value === u.role) ? (
                          <option value={u.role}>{u.role}</option>
                        ) : null}
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={tdClass}>{formatDate(u.createdAt)}</td>
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
