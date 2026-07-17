import { SITE } from "./i18n";

// Builds the `openGraph.images` array for the shared /api/og/generic card —
// used by every page type that isn't a place detail page (which has its own
// photo-backed generator at api/og/place/[slug]).
export function genericOgImage(title: string, subtitle?: string, emoji?: string) {
  const params = new URLSearchParams({ title });
  if (subtitle) params.set("subtitle", subtitle);
  if (emoji) params.set("emoji", emoji);
  return [{ url: `${SITE.origin}/api/og/generic?${params.toString()}`, width: 1200, height: 630 }];
}
