"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/components/cart/CartContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPkr } from "@/content/catalog";
import { getProductById } from "@/content/products-client";

type CartViewProps = {
  /** Optional empty-state copy (CMS). */
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function CartView({
  title,
  description,
  actionLabel,
  actionHref,
}: CartViewProps = {}) {
  const { items, ready, updateQuantity, removeItem, clear } = useCart();

  const lines = useMemo(() => {
    return items
      .map((item) => {
        const product = getProductById(item.productId);
        return product ? { item, product } : null;
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);
  }, [items]);

  const missing = items.length - lines.length;
  const subtotal = lines.reduce((sum, { item, product }) => {
    const unit = product.pricing?.price;
    if (unit == null) return sum;
    return sum + unit * item.quantity;
  }, 0);
  const hasPriced = lines.some(({ product }) => product.pricing?.price != null);

  if (!ready) {
    return <p className="text-sm text-pb-muted">Loading cart…</p>;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={title || "Your cart is empty"}
        description={
          description || "Browse everyday favourites and add products when you are ready."
        }
        actionHref={actionHref || "/"}
        actionLabel={actionLabel || "Shop essentials"}
      />
    );
  }

  return (
    <div className="space-y-6">
      {missing > 0 ? (
        <p className="rounded-xl bg-pb-blush px-4 py-3 text-sm" role="status">
          {missing} saved item(s) are no longer available and were skipped.
        </p>
      ) : null}

      <ul className="divide-y divide-pb-border rounded-2xl border border-pb-border bg-white">
        {lines.map(({ item, product }) => {
          const unit = product.pricing?.price ?? null;
          const lineTotal = unit != null ? unit * item.quantity : null;
          const key = `${product.id}::${item.variantKey || ""}`;
          return (
            <li
              key={key}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              <Link
                href={`/product/${product.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#f7f4f1]"
              >
                <Image
                  src={product.image}
                  alt={product.imageAlt}
                  fill
                  sizes="96px"
                  className="object-contain p-2"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${product.slug}`}
                  className="font-semibold text-pb-charcoal hover:text-pb-pink"
                >
                  {product.name}
                </Link>
                {product.sku ? (
                  <p className="text-xs text-pb-muted">SKU: {product.sku}</p>
                ) : null}
                {item.variantKey ? (
                  <p className="text-xs text-pb-muted">Option: {item.variantKey}</p>
                ) : null}
                <p className="mt-1 text-sm text-pb-muted">
                  {formatPkr(unit) || "Price unavailable"}
                  {!product.available ? " · Out of stock" : ""}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="text-sm" htmlFor={`qty-${key}`}>
                    Qty
                  </label>
                  <input
                    id={`qty-${key}`}
                    type="number"
                    min={1}
                    max={99}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(
                        product.id,
                        Number(e.target.value),
                        item.variantKey,
                      )
                    }
                    className="w-20 rounded-lg border border-pb-border px-2 py-1"
                  />
                  <button
                    type="button"
                    className="text-sm font-semibold text-pb-pink"
                    onClick={() => removeItem(product.id, item.variantKey)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="font-bold text-pb-charcoal sm:w-28 sm:text-right">
                {formatPkr(lineTotal) || "—"}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-4 rounded-2xl border border-pb-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-pb-muted">Subtotal (catalog prices)</p>
          <p className="text-2xl font-bold">
            {hasPriced ? formatPkr(subtotal) : "—"}
          </p>
          <p className="mt-1 text-xs text-pb-muted">
            Final shipping is confirmed by Pink Baby. Totals are revalidated on the server at checkout.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="pb-btn pb-btn-outline" onClick={clear}>
            Clear cart
          </button>
          <Link href="/checkout" className="pb-btn pb-btn-primary">
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
