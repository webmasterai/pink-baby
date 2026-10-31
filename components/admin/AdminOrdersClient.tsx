"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/client-fetch";
import { formatPkr } from "@/content/catalog";

type OrderRow = {
  reference: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalPkr: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  itemCount: number;
};

const statuses = [
  "pending_confirmation",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export function AdminOrdersClient({ initial }: { initial: OrderRow[] }) {
  const [orders, setOrders] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(reference: string, status: string) {
    setMessage(null);
    const res = await apiFetch("/api/admin/orders", {
      method: "PATCH",
      json: { reference, status },
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setMessage(data.error || "Update failed");
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.reference === reference ? { ...o, status } : o)),
    );
    setMessage(`Updated ${reference}`);
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-pb-muted">{message}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-pb-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-pb-border bg-pb-ivory/60">
            <tr>
              <th className="px-3 py-3 font-semibold">Reference</th>
              <th className="px-3 py-3 font-semibold">Customer</th>
              <th className="px-3 py-3 font-semibold">Total</th>
              <th className="px-3 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.reference} className="border-b border-pb-border/70 align-top">
                <td className="px-3 py-3">
                  <p className="font-semibold">{o.reference}</p>
                  <p className="text-xs text-pb-muted">
                    {o.paymentMethod} · {o.paymentStatus} · {o.itemCount} item(s)
                  </p>
                </td>
                <td className="px-3 py-3">
                  <p>{o.customerName}</p>
                  <p className="text-xs text-pb-muted">{o.customerEmail}</p>
                  <p className="text-xs text-pb-muted">{o.customerPhone}</p>
                </td>
                <td className="px-3 py-3 font-semibold">{formatPkr(o.totalPkr)}</td>
                <td className="px-3 py-3">
                  <select
                    className="pb-input"
                    value={o.status}
                    onChange={(e) => updateStatus(o.reference, e.target.value)}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
