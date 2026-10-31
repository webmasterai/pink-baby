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
import { apiFetch } from "@/lib/client-fetch";

const STORAGE_KEY = "pb-wishlist";

type WishlistContextValue = {
  ids: string[];
  ready: boolean;
  count: number;
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function parseWishlist(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id): id is string => typeof id === "string"))];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const mergedRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIds(parseWishlist(localStorage.getItem(STORAGE_KEY)));
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids, ready]);

  useEffect(() => {
    if (!ready || mergedRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "same-origin" });
        const data = (await me.json()) as { user: { id: string } | null };
        if (!data.user || cancelled) return;
        mergedRef.current = true;
        const guest = parseWishlist(localStorage.getItem(STORAGE_KEY));
        const res = await apiFetch("/api/wishlist/sync", {
          method: "POST",
          json: { productIds: guest },
        });
        if (res.ok) {
          const body = (await res.json()) as { productIds: string[] };
          if (!cancelled) setIds(body.productIds);
        }
      } catch {
        // keep local wishlist
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const toggle = useCallback((productId: string) => {
    setIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({
      ids,
      ready,
      count: ids.length,
      has,
      toggle,
      remove,
      clear,
    }),
    [ids, ready, has, toggle, remove, clear],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
