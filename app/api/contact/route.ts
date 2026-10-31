import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/client-ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { isEmailConfigured, saveContactEnquiry } from "@/lib/storage";
import { assertBodySize, contactSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = checkRateLimit(`contact:${ip}`, {
    limit: 5,
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
    assertBodySize(raw, 8_000);
  } catch {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid form data." },
      { status: 400 },
    );
  }

  try {
    await saveContactEnquiry(parsed.data);
    if (!isEmailConfigured()) {
      console.info("[contact] enquiry saved; outbound SMTP is not configured");
    }
    return NextResponse.json(
      {
        message: "Thank you. Your message has been saved.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not save your message. Durable storage may be unavailable.",
      },
      { status: 500 },
    );
  }
}
