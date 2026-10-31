"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_NAV } from "@/components/admin/admin-nav";
import type { AdminCapability } from "@/lib/cms/roles";

export function AdminShell({
  children,
  userName,
  userEmail,
  capabilities,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  capabilities: AdminCapability[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const items = ADMIN_NAV.filter((i) => capabilities.includes(i.capability));
  const initial = (userName || userEmail || "A").trim().charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-[200] flex bg-[#f7f4f5] text-slate-900">
      <aside
        className={`flex h-full flex-col border-r border-pb-border/80 bg-pb-blush transition-all ${
          open ? "w-64" : "w-[4.25rem]"
        }`}
      >
        <div className="border-b border-pb-pink/15 px-3 py-4">
          <Link href="/admin" className="block" aria-label="Pink Baby CMS home">
            {open ? (
              <Image
                src="/images/logo-wordmark.png"
                alt="Pink Baby"
                width={180}
                height={48}
                priority
                className="h-10 w-auto"
              />
            ) : (
              <Image
                src="/images/logo-wordmark.png"
                alt="Pink Baby"
                width={40}
                height={40}
                priority
                className="mx-auto h-8 w-auto object-contain object-left"
              />
            )}
          </Link>
          {open ? (
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-pb-pink">
              CMS Admin
            </p>
          ) : null}
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Admin">
          <ul className="space-y-0.5">
            {items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pb-pink ${
                      active
                        ? "bg-pb-pink font-semibold text-white shadow-sm"
                        : "font-medium text-pb-charcoal hover:bg-white/70 hover:text-pb-pink"
                    }`}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                  >
                    {open ? item.label : item.label.charAt(0)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-pb-pink/15 p-3 space-y-1">
          <Link
            href="/admin/profile"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-pb-charcoal hover:bg-white/70 hover:text-pb-pink"
          >
            {open ? "My Profile & Security" : "Me"}
          </Link>
          <Link
            href="/admin/login"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-pb-muted hover:bg-white/70 hover:text-pb-pink"
            onClick={async (e) => {
              e.preventDefault();
              try {
                const { apiFetch } = await import("@/lib/client-fetch");
                await apiFetch("/api/admin/auth/logout", { method: "POST" });
              } catch {
                await fetch("/api/admin/auth/logout", { method: "POST" });
              }
              window.location.href = "/admin/login";
            }}
          >
            {open ? "Logout" : "⎋"}
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
              aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              ☰
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-slate-900">
                Content Management
              </h1>
              <p className="text-xs text-slate-500">
                Manage website content without code.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-sm font-semibold text-pb-pink hover:underline"
            >
              View Website
            </Link>
            <Link
              href="/admin/profile"
              className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 hover:border-pb-pink"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pb-pink text-sm font-bold text-white">
                {initial}
              </span>
              <span className="hidden text-sm font-medium sm:inline">
                {userName || userEmail}
              </span>
            </Link>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
