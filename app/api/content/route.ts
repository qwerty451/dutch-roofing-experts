import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getContent, saveContent } from "@/lib/content";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";
import { isSafeUrl, sanitizeText } from "@/lib/validate";
import type { Locale, TranslationKey, Translations } from "@/lib/i18n";

const MAX_BODY_BYTES = 64 * 1024; // 64 KB hard cap

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getContent());
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce body size limit
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const current = getContent();

  // --- Sanitize translations ---
  if (input.translations && typeof input.translations === "object") {
    const locales: Locale[] = ["es", "en", "nl"];
    for (const locale of locales) {
      const localeData = (input.translations as Record<string, unknown>)[locale];
      if (localeData && typeof localeData === "object") {
        const sanitized: Partial<Translations> = {};
        for (const [k, v] of Object.entries(localeData as Record<string, unknown>)) {
          sanitized[k as TranslationKey] = sanitizeText(v);
        }
        current.translations[locale] = {
          ...current.translations[locale],
          ...sanitized,
        };
      }
    }
  }

  // --- Sanitize images ---
  if (input.images && typeof input.images === "object") {
    const imgs = input.images as Record<string, unknown>;

    if (typeof imgs.hero === "string") {
      if (!isSafeUrl(imgs.hero)) {
        console.warn("[content] Rejected hero URL:", imgs.hero);
        return NextResponse.json({ error: "Invalid hero image URL" }, { status: 400 });
      }
      current.images.hero = imgs.hero;
    }

    if (typeof imgs.about === "string") {
      if (!isSafeUrl(imgs.about)) {
        console.warn("[content] Rejected about URL:", imgs.about);
        return NextResponse.json({ error: "Invalid about image URL" }, { status: 400 });
      }
      current.images.about = imgs.about;
    }

    if (Array.isArray(imgs.services)) {
      current.images.services = imgs.services.map((s: unknown) => {
        if (typeof s !== "string") return "";
        if (!isSafeUrl(s)) {
          console.warn("[content] Rejected service image URL:", s);
          return "";
        }
        return s;
      });
    }
  }

  saveContent(current);
  console.log("[content] Saved successfully");
  return NextResponse.json({ ok: true });
}
