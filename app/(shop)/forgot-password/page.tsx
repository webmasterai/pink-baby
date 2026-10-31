"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiFetch } from "@/lib/client-fetch";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDevToken(null);
    const form = new FormData(e.currentTarget);
    const res = await apiFetch("/api/auth/forgot-password", {
      method: "POST",
      json: { email: String(form.get("email") || "") },
    });
    const data = (await res.json()) as {
      error?: string;
      message?: string;
      devResetToken?: string;
    };
    if (!res.ok) {
      setError(data.error || "Request failed.");
      return;
    }
    setMessage(data.message || "If an account exists, reset instructions were issued.");
    if (data.devResetToken) setDevToken(data.devResetToken);
  }

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader
        title="Forgot password"
        description="Reset links are single-use and expire. Email delivery needs SMTP configuration."
      />
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-md space-y-3 rounded-2xl border border-pb-border bg-white p-5"
      >
        <label className="block text-sm font-semibold">
          Email
          <input className="pb-input mt-1" type="email" name="email" required />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {devToken ? (
          <p className="break-all rounded-xl bg-pb-blush p-3 text-xs">
            Dev reset token (SMTP not configured):{" "}
            <a className="font-semibold text-pb-pink" href={`/reset-password?token=${devToken}`}>
              use this link
            </a>
          </p>
        ) : null}
        <button type="submit" className="pb-btn pb-btn-primary">
          Send reset
        </button>
      </form>
    </div>
  );
}
