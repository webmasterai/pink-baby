"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/client-fetch";
import { pakistanProvinces } from "@/lib/validation";

type Address = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
  isDefault: number;
};

export function AddressManager({ initial }: { initial: Address[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/addresses", { credentials: "same-origin" });
    if (res.ok) {
      const data = (await res.json()) as { addresses: Address[] };
      setAddresses(data.addresses);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await apiFetch("/api/addresses", {
      method: "POST",
      json: {
        label: String(form.get("label") || ""),
        fullName: String(form.get("fullName") || ""),
        phone: String(form.get("phone") || ""),
        line1: String(form.get("line1") || ""),
        line2: String(form.get("line2") || ""),
        city: String(form.get("city") || ""),
        province: String(form.get("province") || ""),
        postalCode: String(form.get("postalCode") || ""),
        isDefault: form.get("isDefault") === "on",
      },
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save address.");
      return;
    }
    e.currentTarget.reset();
    await refresh();
  }

  async function onDelete(id: string) {
    const res = await apiFetch(`/api/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      json: {},
    });
    if (res.ok) await refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ul className="space-y-3">
        {addresses.length === 0 ? (
          <p className="text-sm text-pb-muted">No saved addresses yet.</p>
        ) : (
          addresses.map((a) => (
            <li key={a.id} className="rounded-2xl border border-pb-border bg-white p-4 text-sm">
              <p className="font-semibold">
                {a.fullName}
                {a.isDefault ? (
                  <span className="ml-2 text-xs font-semibold text-pb-pink">Default</span>
                ) : null}
              </p>
              <p className="text-pb-muted">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
              </p>
              <p className="text-pb-muted">
                {a.city}, {a.province}
                {a.postalCode ? ` ${a.postalCode}` : ""}
              </p>
              <p className="text-pb-muted">{a.phone}</p>
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-pb-pink"
                onClick={() => onDelete(a.id)}
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-pb-border bg-white p-5">
        <h2 className="font-display text-lg font-bold">Add address</h2>
        <label className="block text-sm font-semibold">
          Label
          <input className="pb-input mt-1" name="label" placeholder="Home" />
        </label>
        <label className="block text-sm font-semibold">
          Full name
          <input className="pb-input mt-1" name="fullName" required />
        </label>
        <label className="block text-sm font-semibold">
          Phone
          <input className="pb-input mt-1" name="phone" required />
        </label>
        <label className="block text-sm font-semibold">
          Line 1
          <input className="pb-input mt-1" name="line1" required />
        </label>
        <label className="block text-sm font-semibold">
          Line 2
          <input className="pb-input mt-1" name="line2" />
        </label>
        <label className="block text-sm font-semibold">
          City
          <input className="pb-input mt-1" name="city" required />
        </label>
        <label className="block text-sm font-semibold">
          Province
          <select className="pb-input mt-1" name="province" defaultValue="Punjab">
            {pakistanProvinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Postal code
          <input className="pb-input mt-1" name="postalCode" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="isDefault" />
          Set as default
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="pb-btn pb-btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save address"}
        </button>
      </form>
    </div>
  );
}
