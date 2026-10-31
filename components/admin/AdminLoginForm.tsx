"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { apiFetch } from "@/lib/client-fetch";
import { safeAdminReturnPath } from "@/lib/cms/safe-return";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nextPath = useMemo(
    () => safeAdminReturnPath(searchParams.get("next")),
    [searchParams],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = username.trim();
    if (!trimmed) {
      setError("Enter your username or email.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }

    setBusy(true);
    try {
      const res = await apiFetch("/api/admin/auth/login", {
        method: "POST",
        json: { username: trimmed, password, next: nextPath },
      });
      const data = (await res.json()) as {
        error?: string;
        next?: string;
      };
      if (!res.ok) {
        setError(data.error || "Invalid username or password.");
        setBusy(false);
        return;
      }
      router.replace(safeAdminReturnPath(data.next || nextPath));
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-pb-blush/80 via-[#f3f4f6] to-[#f3f4f6] px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_18px_50px_rgba(43,43,43,0.08)]">
          <div className="mb-6 flex flex-col items-center text-center">
            <Image
              src="/images/logo-wordmark.png"
              alt="Pink Baby"
              width={200}
              height={52}
              priority
              className="h-12 w-auto"
            />
            <p className="mt-4 font-display text-xl font-bold text-pb-charcoal">
              Admin sign in
            </p>
            <p className="mt-1 text-sm text-slate-500">
              CMS access for authorized staff only.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <label className="block text-sm font-semibold text-slate-700">
              Username or email
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-pb-pink focus:ring-2 focus:ring-pb-pink/20"
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin or you@example.com"
                required
                disabled={busy}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Password
              <span className="relative mt-1 block">
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-12 text-sm font-normal outline-none transition focus:border-pb-pink focus:ring-2 focus:ring-pb-pink/20"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-slate-500 hover:text-pb-pink"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
            </label>

            {error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center rounded-xl bg-pb-pink px-4 py-3 text-sm font-bold text-white transition hover:bg-pb-pink-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Storefront shoppers use{" "}
            <Link href="/account" className="font-semibold text-pb-pink hover:underline">
              My account
            </Link>
            . CMS credentials are set via server environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}
