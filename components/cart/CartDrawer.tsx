"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { formatPkr } from "@/content/catalog";
import { getProductById } from "@/content/products-client";
import { IconClose } from "@/components/icons";

const EXIT_MS = 360;

export function CartDrawer() {
  const {
    items,
    ready,
    count,
    drawerOpen,
    lastAdded,
    closeDrawer,
    updateQuantity,
    removeItem,
  } = useCart();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(drawerOpen);
  const [openClass, setOpenClass] = useState(drawerOpen);
  const [subtotalFlash, setSubtotalFlash] = useState(false);
  const prevSubtotal = useRef<number | null>(null);

  const lines = items
    .map((item) => {
      const product = getProductById(item.productId);
      return product ? { item, product } : null;
    })
    .filter((l): l is NonNullable<typeof l> => !!l);

  const subtotal = lines.reduce((sum, { item, product }) => {
    const unit = product.pricing?.price;
    return unit == null ? sum : sum + unit * item.quantity;
  }, 0);

  const justAdded = lastAdded
    ? lines.find(
        (l) =>
          l.product.id === lastAdded.productId &&
          (l.item.variantKey || "") === (lastAdded.variantKey || ""),
      )
    : null;

  useEffect(() => {
    if (prevSubtotal.current != null && prevSubtotal.current !== subtotal) {
      setSubtotalFlash(true);
      const t = window.setTimeout(() => setSubtotalFlash(false), 360);
      prevSubtotal.current = subtotal;
      return () => window.clearTimeout(t);
    }
    prevSubtotal.current = subtotal;
  }, [subtotal]);

  useEffect(() => {
    if (drawerOpen) {
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        setMounted(true);
        raf2 = requestAnimationFrame(() => setOpenClass(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    const raf = requestAnimationFrame(() => setOpenClass(false));
    const t = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = [
        ...(panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) || []),
      ].filter((el) => !el.hasAttribute("disabled"));
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [drawerOpen, closeDrawer]);

  if (!mounted) return null;

  return (
    <div
      className={`pb-drawer-root fixed inset-0 z-[60] ${openClass ? "is-open" : ""}`}
      aria-hidden={!openClass}
    >
      <button
        type="button"
        className="pb-drawer-backdrop absolute inset-0 bg-black/40"
        aria-label="Close cart"
        tabIndex={openClass ? 0 : -1}
        onClick={closeDrawer}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pb-drawer-panel absolute inset-y-0 right-0 flex h-[100dvh] w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-pb-border px-4 py-3">
          <h2 id={titleId} className="font-display text-lg font-bold">
            Your cart ({count})
          </h2>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full"
            aria-label="Close cart drawer"
            onClick={closeDrawer}
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {!ready ? (
          <p className="p-4 text-sm text-pb-muted">Loading cart…</p>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="font-semibold">Your cart is empty</p>
            <button type="button" className="pb-btn pb-btn-primary" onClick={closeDrawer}>
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            {justAdded ? (
              <p
                className="pb-fade-in border-b border-pb-border bg-pb-blush/50 px-4 py-2 text-sm font-semibold text-pb-charcoal"
                role="status"
              >
                Added to cart
              </p>
            ) : null}

            <ul className="flex-1 space-y-3 overflow-y-auto p-4">
              {lines.map(({ item, product }) => {
                const unit = product.pricing?.price ?? null;
                const key = `${product.id}::${item.variantKey || ""}`;
                const highlight =
                  justAdded &&
                  justAdded.product.id === product.id &&
                  (justAdded.item.variantKey || "") === (item.variantKey || "");
                return (
                  <li
                    key={key}
                    className={`pb-cart-line flex gap-3 rounded-2xl border p-3 ${
                      highlight
                        ? "border-pb-pink bg-pb-blush/30"
                        : "border-pb-border"
                    }`}
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f7f4f1]">
                      <Image
                        src={product.image}
                        alt={product.imageAlt}
                        fill
                        sizes="80px"
                        className="object-contain p-1.5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug">{product.name}</p>
                      {item.variantKey ? (
                        <p className="text-xs text-pb-muted">{item.variantKey}</p>
                      ) : null}
                      <p className="mt-1 text-sm font-bold">{formatPkr(unit) || "—"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="sr-only" htmlFor={`drawer-qty-${key}`}>
                          Quantity for {product.name}
                        </label>
                        <input
                          id={`drawer-qty-${key}`}
                          type="number"
                          min={1}
                          max={99}
                          value={item.quantity}
                          className="w-16 rounded-lg border border-pb-border px-2 py-1 text-sm"
                          onChange={(e) =>
                            updateQuantity(
                              product.id,
                              Number(e.target.value),
                              item.variantKey,
                            )
                          }
                        />
                        <button
                          type="button"
                          className="text-xs font-semibold text-pb-pink"
                          onClick={() => removeItem(product.id, item.variantKey)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-pb-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-pb-muted">Subtotal</span>
                <span
                  className={`pb-tick text-lg font-bold ${subtotalFlash ? "is-flash" : ""}`}
                >
                  {formatPkr(subtotal)}
                </span>
              </div>
              <p className="mb-3 text-xs text-pb-muted">
                Shipping is confirmed at checkout when configured.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/checkout"
                  className="pb-btn pb-btn-primary w-full"
                  onClick={closeDrawer}
                >
                  Checkout
                </Link>
                <Link
                  href="/cart"
                  className="pb-btn pb-btn-outline w-full"
                  onClick={closeDrawer}
                >
                  View cart
                </Link>
                <button
                  type="button"
                  className="pb-btn pb-btn-outline w-full"
                  onClick={closeDrawer}
                >
                  Continue shopping
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
