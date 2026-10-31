import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/client-ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { isEmailConfigured, saveNewsletterSubscriber } from "@/lib/storage";
import { assertBodySize, newsletterSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = checkRateLimit(`newsletter:${ip}`, {
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let raw = "";
  try {
    raw = await request.text();
    assertBodySize(raw, 4_000);
  } catch {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid email." },
      { status: 400 },
    );
  }

  try {
    const result = await saveNewsletterSubscriber(parsed.data.email);
    // Keep SMTP/config diagnostics server-side only — never expose to visitors.
    if (!isEmailConfigured()) {
      console.info(
        "[newsletter] subscription saved; outbound SMTP is not configured",
      );
    }
    const message = result.created
      ? "Thank you for subscribing"
      : "You are already subscribed with this email.";

    return NextResponse.json(
      {
        message,
        created: result.created,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not save your subscription. Durable storage may be unavailable.",
      },
      { status: 500 },
    );
  }
}
