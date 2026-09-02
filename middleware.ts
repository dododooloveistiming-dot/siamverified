import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isBlockedCrawler } from "@/lib/crawlers";

const SUPPORTED_LANGS = ["en", "ko", "th", "zh", "ja", "ar", "id", "vi"];

export function middleware(req: NextRequest) {
  // Commercial SEO/scraper crawlers, rejected at the edge before any route,
  // layout or page code runs — and, crucially, before a non-`en` place URL
  // can trigger an on-demand render + ISR write. See lib/crawlers.ts for the
  // policy and why it exists. Search engines and AI assistants pass through.
  if (isBlockedCrawler(req.headers.get("user-agent"))) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "cache-control": "public, max-age=86400" },
    });
  }

  // Requests for an unrecognized 2-letter locale segment (typos, bot probes
  // like /fr/, /de/) used to 500 instead of 404 — several app/[lang]/*
  // pages do `({en:..., ko:...} as const)[lang]` lookups (no "fr" key ->
  // undefined) and then destructure or .map() the result, which throws.
  // A notFound() guard in app/[lang]/layout.tsx doesn't reliably stop the
  // page component from executing first in production, so reject at the
  // edge instead — before any route/layout/page code runs at all.
  const seg = req.nextUrl.pathname.split("/")[1] || "";
  if (/^[a-z]{2}$/.test(seg) && !SUPPORTED_LANGS.includes(seg)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next|api).*)",
};
