import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  console.log(`[auth] POST /api/auth from ${ip}`);

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD) {
    console.error("[auth] ADMIN_PASSWORD env var is not set!");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const { allowed, retryAfterSec } = checkRateLimit(ip);
  if (!allowed) {
    console.warn(`[auth] Rate limited: ${ip}`);
    return NextResponse.json(
      { error: "Te veel pogingen. Probeer later opnieuw." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.warn("[auth] Invalid JSON body");
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).password !== "string"
  ) {
    console.warn("[auth] Missing password field");
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const { password } = body as { password: string };

  if (password !== ADMIN_PASSWORD) {
    console.warn(`[auth] Wrong password attempt from ${ip}`);
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
    return NextResponse.json({ error: "Onjuist wachtwoord" }, { status: 401 });
  }

  resetRateLimit(ip);

  const token = await createSessionToken();
  console.log(`[auth] Login success for ${ip}, setting cookie`);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false, // flip to true once HTTPS reverse proxy is active
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  console.log("[auth] Logout");
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
