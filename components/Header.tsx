"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useCart } from "@/components/cart/CartContext";
import { CartTotalLabel } from "@/components/cart/CartTotalLabel";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { categories, navLinks } from "@/content/categories";
import {
  IconBag,
  IconClose,
  IconHeart,
  IconMenu,
  IconSearch,
  IconUser,
} from "@/components/icons";

type HeaderChromeProps = {
  logoSrc?: string;
  showSearch?: boolean;
  showWishlist?: boolean;
  showAccount?: boolean;
};

export function Header({
  logoSrc,
  showSearch = true,
  showWishlist = true,
  showAccount = true,
}: HeaderChromeProps = {}) {
  const router = useRouter();
  const { count: cartCount, openDrawer } = useCart();
  const { count: wishCount } = useWishlist();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  function openMenu() {
    setMobileOpen(true);
    dialogRef.current?.showModal();
  }

  function closeMenu() {
    setMobileOpen(false);
    setMobileExpanded(null);
    if (dialogRef.current?.open) dialogRef.current.close();
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    closeMenu();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="border-b border-pb-border bg-white">
      <div className="pb-container">
        <div className="flex items-center gap-3 py-3 md:gap-5 md:py-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-pb-charcoal md:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={openMenu}
          >
            <IconMenu className="h-6 w-6" />
          </button>

          <BrandLogo priority className="shrink-0" src={logoSrc} />

          {showSearch ? (
          <form
            onSubmit={onSearch}
            className="mx-auto hidden min-w-0 flex-1 max-w-3xl md:flex"
            role="search"
          >
            <label htmlFor="header-search" className="sr-only">
              Search products
            </label>
            <div className="flex w-full overflow-hidden rounded-full border border-pb-border bg-white">
              <span className="flex items-center pl-4 text-pb-muted" aria-hidden="true">
                <IconSearch className="h-4 w-4" />
              </span>
              <input
                id="header-search"
                type="search"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or SKU"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-[0.95rem] outline-none"
                autoComplete="off"
              />
              <button
                type="submit"
                className="bg-pb-pink px-6 text-[0.95rem] font-bold text-white hover:bg-pb-pink-dark"
              >
                Search
              </button>
            </div>
          </form>
          ) : (
            <div className="mx-auto hidden min-w-0 flex-1 md:block" />
          )}

          <nav aria-label="Account" className="ml-auto flex items-center gap-1 sm:gap-3">
            {showAccount ? (
            <Link
              href="/account"
              className="hidden flex-col items-center gap-0.5 px-1 text-xs font-medium text-pb-charcoal sm:flex"
            >
              <IconUser className="h-5 w-5" />
              <span>Account</span>
            </Link>
            ) : null}
            {showWishlist ? (
            <Link
              href="/wishlist"
              className="relative flex flex-col items-center gap-0.5 px-1 text-xs font-medium text-pb-charcoal"
            >
              <IconHeart className="h-5 w-5" />
              <span className="hidden sm:inline">Wishlist</span>
              {wishCount > 0 ? (
                <span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pb-pink px-1 text-[10px] font-bold text-white">
                  {wishCount}
                </span>
              ) : null}
            </Link>
            ) : null}
            <button
              type="button"
              onClick={openDrawer}
              className="relative flex flex-col items-center gap-0.5 px-1 text-xs font-medium text-pb-charcoal"
              aria-label={`Open cart, ${cartCount} items`}
            >
              <IconBag className="h-5 w-5" />
              <span>
                <CartTotalLabel />
              </span>
              <span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            </button>
          </nav>
        </div>

        <nav
          aria-label="Primary"
          className="hidden items-center justify-center gap-6 border-t border-pb-border/70 py-3.5 text-base font-semibold text-pb-charcoal lg:gap-8 md:flex"
        >
          {categories.map((link) => {
            const hasChildren = (link.children?.length || 0) > 0;
            return (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => hasChildren && setOpenDropdown(link.slug)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-1 hover:text-pb-pink"
                  aria-expanded={hasChildren ? openDropdown === link.slug : undefined}
                  aria-haspopup={hasChildren ? "menu" : undefined}
                  onFocus={() => hasChildren && setOpenDropdown(link.slug)}
                >
                  {link.name}
                  {hasChildren ? (
                    <span aria-hidden="true" className="text-[0.65rem] text-pb-muted">
                      ▾
                    </span>
                  ) : null}
                </Link>
                {hasChildren ? (
                  <ul
                    role="menu"
                    className={`pb-nav-dropdown absolute left-1/2 top-full z-30 min-w-[220px] rounded-2xl border border-pb-border bg-white py-2 shadow-lg ${
                      openDropdown === link.slug ? "is-open" : ""
                    }`}
                  >
                    {link.children!.map((child) => (
                      <li key={child.href} role="none">
                        <Link
                          role="menuitem"
                          href={child.href}
                          tabIndex={openDropdown === link.slug ? 0 : -1}
                          className="block px-4 py-2 text-sm font-semibold text-pb-charcoal hover:bg-pb-blush/40 hover:text-pb-pink"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
          <Link href="/sale" className="text-pb-pink hover:text-pb-pink-dark">
            Sale
          </Link>
        </nav>
      </div>

      <dialog
        ref={dialogRef}
        className="pb-dialog-motion m-0 h-full max-h-none w-full max-w-none border-0 bg-white p-0 text-pb-charcoal backdrop:bg-black/40"
        aria-labelledby={titleId}
        onClose={() => setMobileOpen(false)}
      >
        <div className="flex items-center justify-between border-b border-pb-border px-4 py-3">
          <h2 id={titleId} className="font-display text-lg font-bold">
            Menu
          </h2>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full"
            aria-label="Close menu"
            onClick={closeMenu}
          >
            <IconClose className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          <form onSubmit={onSearch} role="search" className="flex gap-2">
            <label htmlFor="mobile-search" className="sr-only">
              Search products
            </label>
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pb-muted" />
              <input
                id="mobile-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or SKU"
                className="pb-input pl-9"
              />
            </div>
            <button type="submit" className="pb-btn pb-btn-primary px-4">
              Search
            </button>
          </form>
          <ul className="space-y-1">
            {categories.map((link) => {
              const hasChildren = (link.children?.length || 0) > 0;
              const expanded = mobileExpanded === link.slug;
              return (
                <li key={link.href}>
                  <div className="flex items-center gap-1">
                    <Link
                      href={link.href}
                      className="block flex-1 rounded-xl px-3 py-3 text-base font-semibold"
                      onClick={closeMenu}
                    >
                      {link.name}
                    </Link>
                    {hasChildren ? (
                      <button
                        type="button"
                        className="rounded-xl px-3 py-3 text-sm font-semibold text-pb-muted"
                        aria-expanded={expanded}
                        onClick={() =>
                          setMobileExpanded(expanded ? null : link.slug)
                        }
                      >
                        {expanded ? "−" : "+"}
                      </button>
                    ) : null}
                  </div>
                  {hasChildren && expanded ? (
                    <ul className="mb-2 ml-3 space-y-1 border-l border-pb-border pl-3">
                      {link.children!.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block rounded-lg px-2 py-2 text-sm font-medium"
                            onClick={closeMenu}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
            <li>
              <Link
                href="/sale"
                className="block rounded-xl px-3 py-3 text-base font-semibold text-pb-pink"
                onClick={closeMenu}
              >
                Sale
              </Link>
            </li>
            {navLinks.length ? null : null}
            <li>
              <Link
                href="/account"
                className="block rounded-xl px-3 py-3 text-base font-semibold"
                onClick={closeMenu}
              >
                Account
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="block rounded-xl px-3 py-3 text-base font-semibold"
                onClick={closeMenu}
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </dialog>
    </header>
  );
}
