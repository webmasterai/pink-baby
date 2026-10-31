"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { apiFetch } from "@/lib/client-fetch";
import { formatPkr } from "@/content/catalog";
import { getProductById } from "@/content/products-client";
import { pakistanProvinces } from "@/lib/validation";

type PaymentMethod = {
  id: string;
  label: string;
  description: string;
};

type Props = {
  paymentMethods: PaymentMethod[];
  shippingConfigured: boolean;
  shippingPkr: number | null;
  prefill?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
};

export function CheckoutForm({
  paymentMethods,
  shippingConfigured,
  shippingPkr,
  prefill,
}: Props) {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const lines = useMemo(
    () =>
      items
        .map((item) => {
          const product = getProductById(item.productId);
          return product ? { item, product } : null;
        })
        .filter((l): l is NonNullable<typeof l> => !!l),
    [items],
  );

  const subtotal = lines.reduce((sum, { item, product }) => {
    const unit = product.pricing?.price;
    return unit == null ? sum : sum + unit * item.quantity;
  }, 0);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const res = await apiFetch("/api/checkout", {
      method: "POST",
      json: {
        fullName: String(form.get("fullName") || ""),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || ""),
        line1: String(form.get("line1") || ""),
        line2: String(form.get("line2") || ""),
        city: String(form.get("city") || ""),
        province: String(form.get("province") || ""),
        postalCode: String(form.get("postalCode") || ""),
        paymentMethod: String(form.get("paymentMethod") || "order_request"),
        notes: String(form.get("notes") || ""),
        idempotencyKey,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          variantKey: i.variantKey,
          claimedUnitPrice: getProductById(i.productId)?.pricing?.price ?? null,
        })),
      },
    });

    const data = (await res.json()) as {
      error?: string;
      order?: { reference: string; trackingToken: string };
      paymentNote?: string;
    };

    setBusy(false);
    if (!res.ok || !data.order) {
      setError(data.error || "Checkout failed.");
      return;
    }

    clear();
    const qs = new URLSearchParams({
      token: data.order.trackingToken,
    });
    router.push(`/checkout/confirmation/${data.order.reference}?${qs.toString()}`);
  }

  if (!ready) return <p className="text-sm text-pb-muted">Loading checkout…</p>;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-pb-border bg-white p-6">
        <p className="font-semibold">Your cart is empty.</p>
        <Link href="/search" className="pb-btn pb-btn-primary mt-4 inline-flex">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4 rounded-2xl border border-pb-border bg-white p-5">
        <h2 className="font-display text-xl font-bold">Shipping details</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold md:col-span-2">
            Full name
            <input
              className="pb-input mt-1"
              name="fullName"
              required
              defaultValue={prefill?.fullName || ""}
            />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input
              className="pb-input mt-1"
              type="email"
              name="email"
              required
              defaultValue={prefill?.email || ""}
            />
          </label>
          <label className="block text-sm font-semibold">
            Phone
            <input
              className="pb-input mt-1"
              name="phone"
              required
              defaultValue={prefill?.phone || ""}
              placeholder="+92…"
            />
          </label>
          <label className="block text-sm font-semibold md:col-span-2">
            Address line 1
            <input className="pb-input mt-1" name="line1" required />
          </label>
          <label className="block text-sm font-semibold md:col-span-2">
            Address line 2
            <input className="pb-input mt-1" name="line2" />
          </label>
          <label className="block text-sm font-semibold">
            City
            <input className="pb-input mt-1" name="city" required />
          </label>
          <label className="block text-sm font-semibold">
            Province
            <select className="pb-input mt-1" name="province" required defaultValue="Punjab">
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
          <label className="block text-sm font-semibold md:col-span-2">
            Order notes
            <textarea className="pb-input mt-1 min-h-20" name="notes" maxLength={500} />
          </label>
        </div>

        <fieldset className="space-y-3 pt-2">
          <legend className="font-display text-xl font-bold">Payment</legend>
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className="flex cursor-pointer gap-3 rounded-xl border border-pb-border p-3"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                defaultChecked={method.id === paymentMethods[0]?.id}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold">{method.label}</span>
                <span className="block text-sm text-pb-muted">{method.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="pb-btn pb-btn-primary" disabled={busy}>
          {busy ? "Placing order…" : "Place order request"}
        </button>
      </div>

      <aside className="h-fit rounded-2xl border border-pb-border bg-white p-5">
        <h2 className="font-display text-xl font-bold">Order summary</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map(({ item, product }) => (
            <li key={`${product.id}-${item.variantKey || ""}`} className="flex justify-between gap-3">
              <span>
                {product.name} × {item.quantity}
              </span>
              <span className="font-semibold">
                {formatPkr((product.pricing?.price || 0) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-pb-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-semibold">{formatPkr(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className="font-semibold">
              {shippingConfigured && shippingPkr != null
                ? formatPkr(shippingPkr)
                : "To be confirmed"}
            </dd>
          </div>
          <div className="flex justify-between text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-bold">
              {shippingConfigured && shippingPkr != null
                ? formatPkr(subtotal + shippingPkr)
                : formatPkr(subtotal)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-pb-muted">
          Prices are revalidated on the server. Unconfigured card/bank methods are hidden.
        </p>
      </aside>
    </form>
  );
}
