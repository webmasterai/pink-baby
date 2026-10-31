"use client";

import { useMemo } from "react";
import { useCart } from "@/components/cart/CartContext";
import { formatPkr } from "@/content/catalog";
import { getProductById } from "@/content/products-client";
import { siteConfig } from "@/content/site";

export function CartTotalLabel() {
  const { items, ready } = useCart();
  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = getProductById(item.productId);
      const unit = product?.pricing?.price;
      if (unit == null) return sum;
      return sum + unit * item.quantity;
    }, 0);
  }, [items]);

  if (!ready) return <>{siteConfig.currencySymbol} 0</>;
  return <>{formatPkr(total) || `${siteConfig.currencySymbol} 0`}</>;
}
