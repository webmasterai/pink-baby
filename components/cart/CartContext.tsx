"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/types";
import { apiFetch } from "@/lib/client-fetch";

const STORAGE_KEY = "pb-cart";

export type AddItemResult = {
  ok: boolean;
  productId: string;
  variantKey?: string;
  quantityAdded: number;
};

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  count: number;
  drawerOpen: boolean;
  lastAdded: { productId: string; variantKey?: string } | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (
    productId: string,
    quantity?: number,
    variantKey?: string,
  ) => AddItemResult;
  removeItem: (productId: string, variantKey?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantKey?: string) => void;
  clear: () => void;
  replaceItems: (items: CartItem[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(item: Pick<CartItem, "productId" | "variantKey">) {
  return `${item.productId}::${item.variantKey || ""}`;
}

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CartItem =>
          !!item &&
          typeof item === "object" &&
          typeof (item as CartItem).productId === "string" &&
          typeof (item as CartItem).quantity === "number",
      )
      .map((item) => ({
        productId: item.productId,
        quantity: Math.max(1, Math.min(99, Math.floor(item.quantity))),
        variantKey: typeof item.variantKey === "string" ? item.variantKey : undefined,
      }));
  } catch {
    return [];
  }
}

function mergeLines(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const item of [...a, ...b]) {
    const key = lineKey(item);
    const existing = map.get(key);
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + item.quantity);
    } else {
      map.set(key, { ...item });
    }
  }
  return [...map.values()];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<{
    productId: string;
    variantKey?: string;
  } | null>(null);
  const mergedRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setItems(parseCart(localStorage.getItem(STORAGE_KEY)));
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    if (!ready || mergedRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "same-origin" });
        const data = (await me.json()) as { user: { id: string } | null };
        if (!data.user || cancelled) return;
        mergedRef.current = true;
        const guest = parseCart(localStorage.getItem(STORAGE_KEY));
        if (guest.length === 0) {
          const server = await fetch("/api/cart/merge", { credentials: "same-origin" });
          if (server.ok) {
            const body = (await server.json()) as { items: CartItem[] };
            if (!cancelled && body.items) setItems(body.items);
          }
          return;
        }
        const res = await apiFetch("/api/cart/merge", {
          method: "POST",
          json: { items: guest },
        });
        if (res.ok) {
          const body = (await res.json()) as { items: CartItem[] };
          if (!cancelled) setItems(body.items);
        }
      } catch {
        // Guest cart remains local if merge fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const addItem = useCallback(
    (productId: string, quantity = 1, variantKey?: string): AddItemResult => {
      const qty = Math.max(1, Math.min(99, Math.floor(quantity) || 1));
      if (!productId) {
        return { ok: false, productId, variantKey, quantityAdded: 0 };
      }

      setItems((prev) => {
        const key = lineKey({ productId, variantKey });
        const existing = prev.find((i) => lineKey(i) === key);
        if (existing) {
          return prev.map((i) =>
            lineKey(i) === key
              ? { ...i, quantity: Math.min(99, i.quantity + qty) }
              : i,
          );
        }
        return [
          ...prev,
          {
            productId,
            quantity: qty,
            variantKey: variantKey || undefined,
          },
        ];
      });

      setLastAdded({ productId, variantKey });
      setDrawerOpen(true);
      return { ok: true, productId, variantKey, quantityAdded: qty };
    },
    [],
  );

  const removeItem = useCallback((productId: string, variantKey?: string) => {
    const key = lineKey({ productId, variantKey });
    setItems((prev) => prev.filter((i) => lineKey(i) !== key));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantKey?: string) => {
      const key = lineKey({ productId, variantKey });
      const q = Math.floor(quantity);
      if (q < 1) {
        setItems((prev) => prev.filter((i) => lineKey(i) !== key));
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          lineKey(i) === key ? { ...i, quantity: Math.min(99, q) } : i,
        ),
      );
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);
  const replaceItems = useCallback((next: CartItem[]) => setItems(mergeLines([], next)), []);

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      ready,
      count,
      drawerOpen,
      lastAdded,
      openDrawer,
      closeDrawer,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      replaceItems,
    }),
    [
      items,
      ready,
      count,
      drawerOpen,
      lastAdded,
      openDrawer,
      closeDrawer,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      replaceItems,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
