/**
 * Business commerce settings.
 * Only expose payment/shipping options that are explicitly configured.
 * Never invent rates or provider credentials.
 */

export type PaymentMethodId = "order_request" | "cod" | "bank_transfer" | "card_test";

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  description: string;
  /** When false, UI must not present this as a working checkout path. */
  enabled: boolean;
  requiresCredentials: boolean;
};

function envFlag(name: string): boolean {
  return process.env[name] === "true" || process.env[name] === "1";
}

export function getPaymentMethods(): PaymentMethod[] {
  return [
    {
      id: "order_request",
      label: "Order request (confirm by phone / WhatsApp)",
      description:
        "Places a durable order request. Staff confirm availability, shipping, and payment separately. Not a paid checkout.",
      enabled: true,
      requiresCredentials: false,
    },
    {
      id: "cod",
      label: "Cash on delivery",
      description:
        "Pay in cash when the order is delivered. Enable only after the business confirms COD coverage.",
      enabled: envFlag("ENABLE_COD"),
      requiresCredentials: false,
    },
    {
      id: "bank_transfer",
      label: "Bank transfer",
      description: "Pay via bank transfer using details provided after order confirmation.",
      enabled: envFlag("ENABLE_BANK_TRANSFER") && Boolean(process.env.BANK_TRANSFER_INSTRUCTIONS),
      requiresCredentials: true,
    },
    {
      id: "card_test",
      label: "Card payment (test mode)",
      description:
        "Sandbox card checkout. Requires PAYMENT_PROVIDER + test credentials. Not live until webhooks verify payment.",
      enabled:
        envFlag("ENABLE_CARD_TEST") &&
        Boolean(process.env.PAYMENT_PROVIDER) &&
        Boolean(process.env.PAYMENT_TEST_SECRET),
      requiresCredentials: true,
    },
  ];
}

export function getEnabledPaymentMethods(): PaymentMethod[] {
  return getPaymentMethods().filter((m) => m.enabled);
}

/** Flat shipping in PKR when configured; otherwise null (TBC on confirmation). */
export function getConfiguredShippingPkr(): number | null {
  const raw = process.env.SHIPPING_FLAT_PKR;
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().has(email.trim().toLowerCase());
}
