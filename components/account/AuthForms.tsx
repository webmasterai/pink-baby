"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/client-fetch";

function safeNextPath(raw: string | null): string {
  if (!raw) return "/account";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/account";
  // Admin CMS has its own login — never send storefront login into /admin
  if (raw === "/admin" || raw.startsWith("/admin/")) {
    return "/admin/login";
  }
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      json: {
        email: String(form.get("email") || ""),
        password: String(form.get("password") || ""),
      },
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Sign in failed.");
      return;
    }
    const next =
      typeof window !== "undefined"
        ? safeNextPath(new URLSearchParams(window.location.search).get("next"))
        : "/account";
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-pb-border bg-white p-5">
      <h2 className="font-display text-xl font-bold">Sign in</h2>
      <label className="block text-sm font-semibold">
        Email
        <input className="pb-input mt-1" type="email" name="email" required autoComplete="email" />
      </label>
      <label className="block text-sm font-semibold">
        Password
        <input
          className="pb-input mt-1"
          type="password"
          name="password"
          required
          autoComplete="current-password"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" className="pb-btn pb-btn-primary" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-pb-muted">
        <Link href="/forgot-password" className="font-semibold text-pb-pink">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      json: {
        name: String(form.get("name") || ""),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || ""),
        password: String(form.get("password") || ""),
      },
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Registration failed.");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-pb-border bg-white p-5">
      <h2 className="font-display text-xl font-bold">Create account</h2>
      <label className="block text-sm font-semibold">
        Name
        <input className="pb-input mt-1" name="name" required autoComplete="name" />
      </label>
      <label className="block text-sm font-semibold">
        Email
        <input className="pb-input mt-1" type="email" name="email" required autoComplete="email" />
      </label>
      <label className="block text-sm font-semibold">
        Phone
        <input className="pb-input mt-1" name="phone" autoComplete="tel" />
      </label>
      <label className="block text-sm font-semibold">
        Password
        <input
          className="pb-input mt-1"
          type="password"
          name="password"
          required
          minLength={10}
          autoComplete="new-password"
        />
      </label>
      <p className="text-xs text-pb-muted">At least 10 characters with letters and numbers.</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" className="pb-btn pb-btn-primary" disabled={busy}>
        {busy ? "Creating…" : "Register"}
      </button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="pb-btn pb-btn-outline"
      onClick={async () => {
        await apiFetch("/api/auth/logout", { method: "POST", json: {} });
        router.push("/account");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
