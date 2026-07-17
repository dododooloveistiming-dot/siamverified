import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LANGS = ["en", "ko", "th", "zh", "ja", "ar", "id", "vi"];

// Requests for an unrecognized 2-letter locale segment (typos, bot probes
// like /fr/, /de/) used to 500 instead of 404 — several app/[lang]/*
// pages do `({en:..., ko:...} as const)[lang]` lookups (no "fr" key ->
// undefined) and then destructure or .map() the result, which throws.
// A notFound() guard in app/[lang]/layout.tsx doesn't reliably stop the
// page component from executing first in production, so reject at the
// edge instead — before any route/layout/page code runs at all.
export function middleware(req: NextRequest) {
  const seg = req.nextUrl.pathname.split("/")[1] || "";
  if (/^[a-z]{2}$/.test(seg) && !SUPPORTED_LANGS.includes(seg)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next|api).*)",
};
