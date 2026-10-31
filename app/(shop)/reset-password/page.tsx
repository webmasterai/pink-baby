"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiFetch } from "@/lib/client-fetch";
import { Suspense } from "react";

function ResetForm() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await apiFetch("/api/auth/reset-password", {
      method: "POST",
      json: {
        token,
        password: String(form.get("password") || ""),
      },
    });
    const data = (await res.json()) as { error?: string; message?: string };
    if (!res.ok) {
      setError(data.error || "Reset failed.");
      return;
    }
    setMessage(data.message || "Password updated.");
  }

  if (!token) {
    return <p className="text-sm text-pb-muted">Missing reset token.</p>;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-3 rounded-2xl border border-pb-border bg-white p-5"
    >
      <label className="block text-sm font-semibold">
        New password
        <input
          className="pb-input mt-1"
          type="password"
          name="password"
          required
          minLength={10}
          autoComplete="new-password"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? (
        <p className="text-sm text-emerald-700">
          {message}{" "}
          <Link href="/account" className="font-semibold text-pb-pink">
            Sign in
          </Link>
        </p>
      ) : null}
      <button type="submit" className="pb-btn pb-btn-primary">
        Update password
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader title="Reset password" description="Choose a new password for your account." />
      <Suspense fallback={<p className="text-sm text-pb-muted">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
