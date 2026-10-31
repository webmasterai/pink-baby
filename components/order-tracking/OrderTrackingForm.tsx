"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatPkr } from "@/content/catalog";

type Tracked = {
  reference: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalPkr: number;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    lineTotalPkr: number;
  }>;
};

type Props = {
  title?: string;
  description?: string;
};

export function OrderTrackingForm({
  title = "Order tracking",
  description = "Look up your own order with the reference plus the email or phone used at checkout.",
}: Props = {}) {
  const [order, setOrder] = useState<Tracked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOrder(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: String(form.get("reference") || ""),
        identity: String(form.get("identity") || ""),
      }),
    });
    const data = (await res.json()) as { error?: string; order?: Tracked };
    setBusy(false);
    if (!res.ok || !data.order) {
      setError(data.error || "Order not found.");
      return;
    }
    setOrder(data.order);
  }

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader title={title} description={description} />
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-md space-y-3 rounded-2xl border border-pb-border bg-white p-5"
      >
        <label className="block text-sm font-semibold" htmlFor="order-id">
          Order reference
          <input id="order-id" className="pb-input mt-1" name="reference" required placeholder="PB-…" />
        </label>
        <label className="block text-sm font-semibold">
          Email or phone on the order
          <input className="pb-input mt-1" name="identity" required />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="pb-btn pb-btn-primary" disabled={busy}>
          {busy ? "Looking up…" : "Track order"}
        </button>
      </form>

      {order ? (
        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-pb-border bg-white p-5 text-sm">
          <p className="font-bold">{order.reference}</p>
          <p className="mt-1 text-pb-muted">
            {order.status} · {order.paymentStatus} · {order.paymentMethod}
          </p>
          <p className="mt-2 font-semibold">Total {formatPkr(order.totalPkr)}</p>
          <ul className="mt-3 divide-y divide-pb-border">
            {order.items.map((item, i) => (
              <li key={`${item.name}-${i}`} className="flex justify-between py-2">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatPkr(item.lineTotalPkr)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
