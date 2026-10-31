"use client";

import { useState } from "react";
import { inputClass } from "@/components/admin/StructuredDocForm";
import {
  formatDate,
  Loading,
  Notice,
  PageHead,
  tableWrap,
  tdClass,
  thClass,
  useAdminResource,
} from "@/components/admin/AdminUi";

type Customer = {
  id: string;
  name?: string;
  email: string;
  phone?: string | null;
  role?: string;
  orderCount?: number;
  createdAt?: string;
};

export default function AdminCustomersPage() {
  const { data, error, loading, missing } = useAdminResource<{ customers?: Customer[] }>(
    "/api/admin/cms/customers",
  );
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const customers = (data?.customers || []).filter(
    (c) =>
      !needle ||
      c.email.toLowerCase().includes(needle) ||
      (c.name || "").toLowerCase().includes(needle) ||
      (c.phone || "").includes(needle),
  );

  return (
    <div className="space-y-5">
      <PageHead
        title="Customers"
        description="Registered customer accounts. Passwords and credentials are never shown."
      />
      <input
        className={`${inputClass} max-w-xs`}
        placeholder="Search customers…"
        aria-label="Search customers"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Notice error={error} />
      {missing ? (
        <Notice info="The customers API (/api/admin/cms/customers) is not available yet." />
      ) : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                <th className={thClass}>Name</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Phone</th>
                <th className={thClass}>Orders</th>
                <th className={thClass}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td className={tdClass} colSpan={5}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td className={`${tdClass} font-semibold`}>{c.name || "—"}</td>
                    <td className={tdClass}>{c.email}</td>
                    <td className={tdClass}>{c.phone || "—"}</td>
                    <td className={tdClass}>{c.orderCount ?? "—"}</td>
                    <td className={tdClass}>{formatDate(c.createdAt)}</td>
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
