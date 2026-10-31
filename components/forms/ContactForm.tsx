"use client";

import { useState, type FormEvent } from "react";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status.type === "loading") return;
    setStatus({ type: "loading" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus({
          type: "error",
          message: data.error || "Could not send your message.",
        });
        return;
      }
      setName("");
      setEmail("");
      setMessage("");
      setStatus({
        type: "success",
        message: data.message || "Message saved. We will review it soon.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Please try again.",
      });
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4" noValidate>
      <div>
        <label htmlFor="contact-name" className="mb-1 block text-sm font-semibold">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="pb-input"
          disabled={status.type === "loading"}
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1 block text-sm font-semibold">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pb-input"
          disabled={status.type === "loading"}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-semibold">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="pb-input resize-y"
          disabled={status.type === "loading"}
        />
      </div>
      <button
        type="submit"
        className="pb-btn pb-btn-primary"
        disabled={status.type === "loading"}
      >
        {status.type === "loading" ? "Sending…" : "Send message"}
      </button>
      <div aria-live="polite" className="min-h-6 text-sm">
        {status.type === "success" ? (
          <p className="text-emerald-700">{status.message}</p>
        ) : null}
        {status.type === "error" ? (
          <p className="text-red-700">{status.message}</p>
        ) : null}
      </div>
    </form>
  );
}
