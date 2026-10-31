"use client";

import { useEffect, type ReactNode } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartContext";
import { WishlistProvider } from "@/components/wishlist/WishlistContext";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("js-ready");
  }, []);

  return (
    <CartProvider>
      <WishlistProvider>
        {children}
        <CartDrawer />
      </WishlistProvider>
    </CartProvider>
  );
}
