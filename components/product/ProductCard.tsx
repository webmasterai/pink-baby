"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Product } from "@/content/products-client";
import { formatPkr } from "@/content/catalog";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { IconEye, IconHeart } from "@/components/icons";
import { displaySku } from "@/lib/product-content";

export function ProductCard({
  product,
  layout = "grid",
}: {
  product: Product;
  layout?: "grid" | "list";
}) {
  const { has, toggle } = useWishlist();
  const { addItem } = useCart();
  const [quickOpen, setQuickOpen] = useState(false);
  const [addedPulse, setAddedPulse] = useState(false);
  const [adding, setAdding] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const wished = has(product.id);
  const priceLabel = formatPkr(product.pricing?.price ?? null);
  const regularLabel =
    product.pricing?.onSale && product.pricing.regularPrice != null
      ? formatPkr(product.pricing.regularPrice)
      : null;
  const needsOptions = product.attributes.some((a) => a.terms.length > 0);
  const sku = displaySku(product.sku, product.name);
  const href = `/product/${product.slug}`;

  function onPrimaryAction() {
    if (!product.available || adding) return;
    if (needsOptions) {
      window.location.href = href;
      return;
    }
    setAdding(true);
    const result = addItem(product.id, 1);
    if (result?.ok !== false) {
      setAddedPulse(true);
      window.setTimeout(() => {
        setAddedPulse(false);
        setAdding(false);
      }, 520);
    } else {
      setAdding(false);
    }
  }

  function onWishlist() {
    toggle(product.id);
    setHeartPop(true);
    window.setTimeout(() => setHeartPop(false), 400);
  }

  const primaryLabel = !product.available
    ? "Out of stock"
    : needsOptions
      ? "Choose options"
      : adding && !addedPulse
        ? "Adding…"
        : addedPulse
          ? "Added"
          : "Add to cart";

  return (
    <article
      className={
        layout === "list"
          ? "pb-card-lift flex h-full flex-row gap-4 rounded-2xl border border-pb-border bg-white p-3 md:p-4"
          : "pb-card-lift flex h-full flex-col rounded-2xl border border-pb-border bg-white p-3 md:p-4"
      }
    >
      <div
        className={`group relative overflow-hidden rounded-xl bg-[#f7f4f1] ${
          layout === "list"
            ? "h-28 w-28 shrink-0 sm:h-36 sm:w-36"
            : "aspect-square w-full"
        }`}
      >
        <Link
          href={href}
          className="absolute inset-0 z-0"
          aria-label={`View ${product.name}`}
        >
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            sizes={
              layout === "list"
                ? "144px"
                : "(max-width:640px) 50vw, (max-width:1280px) 33vw, 25vw"
            }
            className="pb-img-zoom object-contain p-4 md:p-5"
          />
        </Link>

        <button
          type="button"
          className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-pb-pink shadow-sm hover:bg-pb-blush focus-visible:bg-pb-blush"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          onClick={onWishlist}
        >
          <IconHeart
            className={`h-5 w-5 ${heartPop ? "pb-heart-pop" : ""}`}
            style={{ fill: wished ? "currentColor" : "none" }}
          />
        </button>

        {!product.available ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-pb-charcoal/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Out of stock
          </span>
        ) : null}

        {/* Quick view: always visible on touch; hover/focus on fine pointers */}
        <button
          type="button"
          title="Quick view"
          aria-label="Quick view"
          className="pb-quick-view absolute bottom-2 left-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-pb-charcoal shadow-md hover:bg-pb-pink hover:text-white focus-visible:bg-pb-pink focus-visible:text-white max-md:opacity-100 max-md:translate-y-0"
          onClick={(e) => {
            e.preventDefault();
            setQuickOpen(true);
          }}
        >
          <IconEye className="h-5 w-5" />
        </button>
      </div>

      <div
        className={`flex min-w-0 flex-1 flex-col ${
          layout === "list" ? "justify-center text-left" : "text-center"
        }`}
      >
        <h3
          className={`mt-3 font-semibold leading-snug text-pb-charcoal ${
            layout === "list"
              ? "mt-0 line-clamp-2 text-base"
              : "line-clamp-2 min-h-[2.75rem] text-[0.95rem] md:min-h-[3rem] md:text-base"
          }`}
        >
          <Link href={href} className="hover:text-pb-pink">
            {product.name}
          </Link>
        </h3>

        <div className={`mt-1 ${layout === "list" ? "" : "min-h-[2.5rem]"}`}>
          {priceLabel ? (
            <p className="font-bold text-pb-charcoal">
              {regularLabel ? (
                <span className="mr-2 font-medium text-pb-muted line-through">
                  {regularLabel}
                </span>
              ) : null}
              {priceLabel}
            </p>
          ) : (
            <p className="text-sm text-pb-muted">Price on request</p>
          )}
          <p
            className={`text-xs font-semibold ${
              product.available ? "text-emerald-700" : "text-pb-muted"
            }`}
          >
            {product.available ? "In stock" : "Out of stock"}
          </p>
        </div>

        <div className={`mt-auto pt-3 ${layout === "list" ? "max-w-xs" : ""}`}>
          <button
            type="button"
            className={`pb-btn pb-btn-primary w-full whitespace-nowrap px-3 text-sm disabled:cursor-not-allowed disabled:opacity-55 ${
              addedPulse ? "pb-added-pulse" : ""
            }`}
            disabled={(!product.available && !needsOptions) || adding}
            onClick={onPrimaryAction}
            aria-live="polite"
          >
            {primaryLabel}
          </button>
        </div>
      </div>

      {quickOpen ? (
        <QuickViewModal
          product={product}
          sku={sku}
          priceLabel={priceLabel}
          available={product.available}
          needsOptions={needsOptions}
          onClose={() => setQuickOpen(false)}
          onAdd={() => {
            if (needsOptions) {
              window.location.href = href;
              return;
            }
            addItem(product.id, 1);
            setQuickOpen(false);
          }}
        />
      ) : null}
    </article>
  );
}

function QuickViewModal({
  product,
  sku,
  priceLabel,
  available,
  needsOptions,
  onClose,
  onAdd,
}: {
  product: Product;
  sku: string | null;
  priceLabel: string | null;
  available: boolean;
  needsOptions: boolean;
  onClose: () => void;
  onAdd: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const [openClass, setOpenClass] = useState(false);
  const closingRef = useRef(false);

  function requestClose() {
    if (closingRef.current) return;
    closingRef.current = true;
    setOpenClass(false);
    window.setTimeout(() => onClose(), 280);
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpenClass(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    prevFocus.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current
      ?.querySelector<HTMLElement>("button, a, input")
      ?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = [
        ...panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => !el.hasAttribute("disabled"));
      if (!nodes.length) return;
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
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      prevFocus.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close via requestClose
  }, []);

  return (
    <div
      className={`pb-modal-root fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 ${
        openClass ? "is-open" : ""
      }`}
      role="presentation"
      onClick={requestClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pb-modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-2xl bg-[#f7f4f1]">
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            sizes="400px"
            className="object-contain p-6"
          />
        </div>
        <h3 id={titleId} className="mt-4 font-display text-xl font-bold">
          {product.name}
        </h3>
        {sku ? <p className="text-sm text-pb-muted">SKU: {sku}</p> : null}
        <p className="mt-2 text-lg font-bold">{priceLabel || "Price on request"}</p>
        <p className="mt-3 line-clamp-4 text-sm text-pb-muted">
          {product.shortDescription || product.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="pb-btn pb-btn-primary whitespace-nowrap"
            disabled={!available && !needsOptions}
            onClick={onAdd}
          >
            {!available ? "Out of stock" : needsOptions ? "Choose options" : "Add to cart"}
          </button>
          <Link
            href={`/product/${product.slug}`}
            className="pb-btn pb-btn-outline"
            onClick={requestClose}
          >
            Full details
          </Link>
          <button type="button" className="pb-btn pb-btn-outline" onClick={requestClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
