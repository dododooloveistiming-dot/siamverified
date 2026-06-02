import type { Lang, Place } from "@/lib/types";
import { nicheName } from "@/lib/types";
import { t } from "@/lib/i18n";
import type { PlaceSignals } from "@/lib/signals";

export type Highlight = { icon: string; label: string; tone: "default" | "good" | "accent" };

// Fill {y}/{n} placeholders in an i18n string.
function fmt(key: Parameters<typeof t>[0], lang: Lang, vars: Record<string, string | number>): string {
  let s = t(key, lang);
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

// Build the language-localized "at a glance" highlight chips for a place,
// purely from structured data. Items with no data are omitted.
export function placeHighlights(place: Place, lang: Lang, signals: PlaceSignals): Highlight[] {
  const out: Highlight[] = [];

  out.push({
    icon: "📍",
    label: `${nicheName(place.niche, lang)}${place.city ? ` · ${place.city}` : ""}`,
    tone: "default",
  });

  if (place.rating != null) {
    const rev = place.review_count ? ` (${fmt("hl_reviews", lang, { n: place.review_count.toLocaleString() })})` : "";
    out.push({ icon: "⭐", label: `${place.rating.toFixed(1)}${rev}`, tone: "good" });
  }

  if (signals.foundingYear) {
    const age = signals.ageYears ? ` · ${fmt("hl_years", lang, { n: signals.ageYears })}` : "";
    out.push({ icon: "🏛", label: `${fmt("hl_since", lang, { y: signals.foundingYear })}${age}`, tone: "default" });
  }

  if (signals.recencyTier === "very_active") {
    out.push({ icon: "🟢", label: t("filter_active", lang), tone: "good" });
  }

  if (place.is_beginner_friendly) {
    out.push({ icon: "🟢", label: t("filter_beginner", lang), tone: "good" });
  }

  if (lang !== "th" && place.languages[lang]) {
    out.push({ icon: "💬", label: t("hl_lang_ok", lang), tone: "accent" });
  }

  if (place.is_open_24h) {
    out.push({ icon: "🌙", label: t("filter_24h", lang), tone: "default" });
  }

  if (place.price_min_thb > 0) {
    out.push({ icon: "💲", label: fmt("hl_price_from", lang, { n: place.price_min_thb.toLocaleString() }), tone: "accent" });
  } else {
    out.push({ icon: "💲", label: t("hl_price_on_inquiry", lang), tone: "default" });
  }

  return out;
}
