import { ImageResponse } from "next/og";

// Shared social-card generator for every page type that isn't a place detail
// page (which has its own photo-backed generator at api/og/place/[slug]).
// Guide/city/best/compare/faq/blog/category pages all had NO og:image at
// all before this — Twitter cards and Google Discover/Search image previews
// silently fell back to nothing. Query-param driven so any page can opt in
// with a one-line `images` array pointing here.
export const runtime = "edge";
export const dynamic = "force-static";
export const revalidate = 60 * 60 * 24 * 90;

const SIZE = { width: 1200, height: 630 } as const;

function clamp(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = clamp(searchParams.get("title") || "Verified Thai", 90);
  const subtitle = clamp(searchParams.get("subtitle") || "", 110);
  const emoji = searchParams.get("emoji") || "✅";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          backgroundColor: "#0b3d2a",
          backgroundImage: "radial-gradient(circle at 85% 15%, rgba(16,185,129,0.35), transparent 55%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "56px 60px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26 }}>
          <span
            style={{
              fontSize: 22, fontWeight: 800, color: "#a7f3d0",
              background: "rgba(16,185,129,0.22)",
              padding: "8px 18px", borderRadius: 999,
              border: "2px solid rgba(167,243,208,0.5)",
              display: "flex",
            }}
          >
            ✓ Verified Thai
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, display: "flex" }}>{emoji}</div>
          <div
            style={{
              marginTop: 20, fontSize: 66, fontWeight: 900, lineHeight: 1.08,
              maxWidth: 1050, textShadow: "0 4px 16px rgba(0,0,0,0.4)", display: "flex",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ marginTop: 22, fontSize: 30, opacity: 0.85, maxWidth: 1000, display: "flex" }}>
              {subtitle}
            </div>
          )}
        </div>

        <div style={{ fontSize: 22, opacity: 0.7, display: "flex" }}>verifiedthai.com</div>
      </div>
    ),
    SIZE,
  );
}
