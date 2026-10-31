"use client";

import { useState, type FormEvent } from "react";
import { IconEnvelope } from "@/components/icons";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function NewsletterForm({
  heading,
  text,
  successMessage = "Thanks — you are on the list.",
}: {
  heading: string;
  text: string;
  successMessage?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status.type === "loading") return;
    setStatus({ type: "loading" });

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus({
          type: "error",
          message: data.error || "Subscription failed. Please try again.",
        });
        return;
      }
      setEmail("");
      setStatus({
        type: "success",
        message: data.message || successMessage,
      });
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Please check your connection and try again.",
      });
    }
  }

  return (
    <section className="bg-pb-blush py-8 md:py-9">
      <div className="pb-container">
        <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="md:max-w-md">
            <h2 className="font-display text-2xl font-bold text-pb-pink md:text-[1.65rem]">
              {heading}
            </h2>
            <p className="mt-1 text-sm text-pb-muted md:text-[0.95rem]">
              {text}
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-stretch md:ml-auto"
            noValidate
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <div className="relative flex-1">
              <span
                className="pointer-events-none absolute top-1/2 left-3.5 z-[1] flex h-[18px] w-[18px] -translate-y-1/2 items-center justify-center text-pb-muted"
                aria-hidden="true"
              >
                <IconEnvelope className="h-[18px] w-[18px]" />
              </span>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                /* pl overrides .pb-input shorthand padding so the icon never covers text */
                className="pb-input h-11 rounded-full !py-2.5 !pr-4 !pl-[2.75rem] sm:rounded-r-none"
                disabled={status.type === "loading"}
              />
            </div>
            <button
              type="submit"
              className="pb-btn pb-btn-primary h-11 rounded-full sm:rounded-l-none sm:rounded-r-full"
              disabled={status.type === "loading"}
            >
              {status.type === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        </div>

        <div className="mt-2 min-h-5 text-sm md:text-right" aria-live="polite">
          {status.type === "success" ? (
            <p className="pb-status-msg text-emerald-700">{status.message}</p>
          ) : null}
          {status.type === "error" ? (
            <p className="pb-status-msg text-red-700">{status.message}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
