"use client";

import { useMemo } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProductById } from "@/content/products-client";

type WishlistViewProps = {
  /** Optional empty-state copy (CMS). */
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function WishlistView({
  title,
  description,
  actionLabel,
  actionHref,
}: WishlistViewProps = {}) {
  const { ids, ready, clear } = useWishlist();
  const { addItem } = useCart();

  const products = useMemo(
    () =>
      ids
        .map((id) => getProductById(id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined),
    [ids],
  );

  if (!ready) {
    return <p className="text-sm text-pb-muted">Loading wishlist…</p>;
  }

  if (ids.length === 0) {
    return (
      <EmptyState
        title={title || "Your wishlist is empty"}
        description={description || "Tap the heart on a product to save it for later."}
        actionHref={actionHref || "/"}
        actionLabel={actionLabel || "Browse products"}
      />
    );
  }

  function addAllAvailable() {
    for (const product of products) {
      if (product.available) addItem(product.id, 1);
    }
  }

  return (
    <div className="space-y-6">
      {products.length < ids.length ? (
        <p className="rounded-xl bg-pb-blush px-4 py-3 text-sm" role="status">
          Some saved items are no longer available.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="pb-btn pb-btn-primary" onClick={addAllAvailable}>
          Add available to cart
        </button>
        <button type="button" className="text-sm font-semibold text-pb-muted" onClick={clear}>
          Clear wishlist
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
