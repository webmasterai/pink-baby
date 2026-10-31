"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { productWhatsAppHref } from "@/lib/whatsapp";

type Attribute = {
  name: string;
  terms: string[];
};

type Props = {
  productId: string;
  productName: string;
  productSlug: string;
  sku: string | null;
  available: boolean;
  unitPrice: number | null;
  attributes?: Attribute[];
  maxQuantity?: number;
};

export function ProductActions({
  productId,
  productName,
  productSlug,
  sku,
  available,
  unitPrice,
  attributes = [],
  maxQuantity = 99,
}: Props) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const wished = has(productId);
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const attr of attributes) {
      if (attr.terms[0]) init[attr.name] = attr.terms[0];
    }
    return init;
  });
  const [error, setError] = useState<string | null>(null);
  const [addedPulse, setAddedPulse] = useState(false);
  const [adding, setAdding] = useState(false);
  const [heartPop, setHeartPop] = useState(false);

  const variantKey = useMemo(() => {
    if (!attributes.length) return "";
    return JSON.stringify(selected);
  }, [attributes.length, selected]);

  const variantLabel = useMemo(() => {
    if (!attributes.length) return null;
    return Object.entries(selected)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  }, [attributes.length, selected]);

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const waHref = productWhatsAppHref({
    name: productName,
    sku,
    variant: variantLabel,
    quantity: qty,
    unitPricePkr: unitPrice,
    productUrl: `${siteUrl}/product/${productSlug}`,
  });

  function onAdd() {
    setError(null);
    if (adding) return;
    if (!available) {
      setError("This product is currently unavailable.");
      return;
    }
    if (qty < 1 || qty > maxQuantity) {
      setError(`Quantity must be between 1 and ${maxQuantity}.`);
      return;
    }
    setAdding(true);
    const result = addItem(productId, qty, variantKey || undefined);
    if (!result.ok) {
      setError("Could not add to cart.");
      setAdding(false);
      return;
    }
    setAddedPulse(true);
    window.setTimeout(() => {
      setAddedPulse(false);
      setAdding(false);
    }, 520);
  }

  return (
    <div className="space-y-4">
      {attributes.map((attr) => (
        <label key={attr.name} className="block text-sm font-semibold">
          {attr.name}
          <select
            className="pb-input mt-1"
            value={selected[attr.name] || ""}
            onChange={(e) =>
              setSelected((prev) => ({ ...prev, [attr.name]: e.target.value }))
            }
          >
            {attr.terms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        </label>
      ))}

      <label className="block text-sm font-semibold">
        Quantity
        <input
          type="number"
          min={1}
          max={maxQuantity}
          value={qty}
          disabled={!available}
          onChange={(e) =>
            setQty(Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1)))
          }
          className="pb-input mt-1 w-24"
        />
      </label>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={`pb-btn pb-btn-primary ${addedPulse ? "pb-added-pulse" : ""}`}
          disabled={!available || adding}
          onClick={onAdd}
          aria-live="polite"
        >
          {adding && !addedPulse ? "Adding…" : addedPulse ? "Added" : "Add to cart"}
        </button>
        <button
          type="button"
          className={`pb-btn pb-btn-outline ${heartPop ? "pb-heart-pop" : ""}`}
          aria-pressed={wished}
          onClick={() => {
            toggle(productId);
            setHeartPop(true);
            window.setTimeout(() => setHeartPop(false), 400);
          }}
        >
          {wished ? "Wishlisted" : "Wishlist"}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="pb-btn pb-btn-whatsapp"
        >
          WhatsApp
        </a>
      </div>
      <p className="text-xs text-pb-muted">
        WhatsApp opens a prefilled message only — it does not place or pay for an order.
      </p>
    </div>
  );
}
