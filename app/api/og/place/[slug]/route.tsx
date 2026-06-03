import { ImageResponse } from "next/og";
import { getPlaceBySlug } from "@/lib/data";
import type { Niche } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";

// Runtime-generated, CDN-cached forever. 25K possible variants is too much
// to pre-bake at build (worker OOM), so we go on-demand: first share
// triggers gen (~1-2s), subsequent shares hit Vercel edge cache (instant).
export const runtime = "nodejs";          // loadPlaces uses fs, can't use edge
export const dynamic = "force-static";    // generate on first request, then cached
export const revalidate = 31536000;       // 1 year — venue data drifts slowly

const SIZE = { width: 1200, height: 630 } as const;

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const place = getPlaceBySlug(params.slug);
  if (!place) {
    return new ImageResponse(<div style={{ display: "flex" }}>Not found</div>, SIZE);
  }
  const meta = NICHE_META[place.niche as Niche];
  const heroPhoto = place.top_photo_url || (place.photos_sample && place.photos_sample[0]) || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex", flexDirection: "column",
          position: "relative",
          backgroundColor: "#0b3d2a",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
        <div
          style={{
            position: "absolute", inset: 0, display: "flex",
            background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.88) 100%)",
          }}
        />

        <div
          style={{
            position: "relative", display: "flex",
            justifyContent: "space-between", alignItems: "center",
            padding: "36px 48px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 32 }}>
            <span>{meta.emoji}</span>
            <span style={{ fontWeight: 700, color: "#d1fae5" }}>
              {nicheName(place.niche as Niche, "en")}
            </span>
          </div>
          <div
            style={{
              fontSize: 22, fontWeight: 800, color: "#a7f3d0",
              background: "rgba(16,185,129,0.22)",
              padding: "8px 18px", borderRadius: 999,
              border: "2px solid rgba(167,243,208,0.5)",
              display: "flex",
            }}
          >
            ✓ Verified Thai
          </div>
        </div>

        <div
          style={{
            position: "relative", marginTop: "auto", display: "flex",
            flexDirection: "column", padding: "0 48px 56px 48px",
          }}
        >
          <div
            style={{
              fontSize: 72, fontWeight: 900, lineHeight: 1.05, maxWidth: 1080,
              textShadow: "0 4px 16px rgba(0,0,0,0.6)", display: "flex",
            }}
          >
            {place.name.length > 64 ? place.name.slice(0, 62) + "…" : place.name}
          </div>

          <div
            style={{
              marginTop: 26, display: "flex", alignItems: "center",
              gap: 28, fontSize: 28, flexWrap: "wrap",
            }}
          >
            {place.rating != null && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(245,158,11,0.95)", color: "#1e1410",
                  padding: "10px 20px", borderRadius: 14, fontWeight: 900,
                }}
              >
                ★ {place.rating.toFixed(1)}
                {place.review_count ? (
                  <span style={{ fontWeight: 600, opacity: 0.7, fontSize: 22, display: "flex" }}>
                    ({place.review_count.toLocaleString()})
                  </span>
                ) : null}
              </div>
            )}
            <div
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(16,185,129,0.95)", color: "white",
                padding: "10px 20px", borderRadius: 14, fontWeight: 900,
              }}
            >
              Trust {place.trust_score}
              <span style={{ fontSize: 18, opacity: 0.85, display: "flex" }}>/100</span>
            </div>
            {place.city && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.92 }}>
                📍 {place.city}
              </div>
            )}
            {place.is_veteran && place.founding_year && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(251,191,36,0.92)", color: "#3a2300",
                  padding: "10px 20px", borderRadius: 14, fontWeight: 900,
                }}
              >
                🏛 Since {place.founding_year}
              </div>
            )}
          </div>
          <div style={{ marginTop: 24, fontSize: 20, opacity: 0.78, display: "flex" }}>
            verifiedthai.com · 0% commission direct booking
          </div>
        </div>
      </div>
    ),
    SIZE,
  );
}
