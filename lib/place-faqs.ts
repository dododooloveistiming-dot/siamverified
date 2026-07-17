import type { Lang, Place } from "@/lib/types";
import { t, tf } from "@/lib/i18n";

export type PlaceFaq = { q: string; a: string };

// Build the localized per-place FAQ set from structured data. These feed both
// the visible accordion and the FAQPage/QAPage JSON-LD — the AEO payload — so
// every string resolves through the i18n dictionary, not English literals.
// Mirrors the structured-from-data approach of placeHighlights().
export function buildPlaceFaqs(place: Place, lang: Lang): PlaceFaq[] {
  const faqs: PlaceFaq[] = [];
  const name = place.name;

  // Location — address is raw source data; only the Maps prefix is localized.
  faqs.push({
    q: tf("pf_loc_q", lang, { name }),
    a:
      tf("pf_loc_a", lang, { addr: place.address || place.city || "Thailand" }) +
      (place.google_maps_url ? tf("pf_loc_maps", lang, { url: place.google_maps_url }) : ""),
  });

  // Booking / contact — always present.
  faqs.push({
    q: tf("pf_book_q", lang, { name }),
    a:
      tf("pf_book_a", lang, { name }) +
      (place.phone ? tf("pf_book_phone", lang, { phone: place.phone }) : ""),
  });

  // Languages spoken — localized language names. Only codes we actually have
  // a name for; an unrecognized code from the scraper would otherwise show
  // as a raw "langname_xx" fallback string in the FAQ text.
  const KNOWN_LANG_CODES = new Set(["en", "ko", "th", "zh", "ja", "ar", "id", "vi"]);
  const langsSpoken = (Object.entries(place.languages) as Array<[string, boolean]>)
    .filter(([k, v]) => v && KNOWN_LANG_CODES.has(k))
    .map(([k]) => t(`langname_${k}` as "langname_en", lang));
  if (langsSpoken.length > 0) {
    faqs.push({
      q: t("pf_lang_q", lang),
      a: tf("pf_lang_a", lang, { name, langs: langsSpoken.join(", ") }),
    });
  }

  // Pricing. price_unit is "unknown" for most priced places in the dataset
  // — fall back to a sentence without the "per {unit}" clause rather than
  // literally rendering "per unknown".
  if (place.price_min_thb > 0) {
    const price =
      `฿${place.price_min_thb.toLocaleString()}` +
      (place.price_max_thb > place.price_min_thb ? `–฿${place.price_max_thb.toLocaleString()}` : "");
    const hasUnit = !!place.price_unit && place.price_unit !== "unknown";
    faqs.push({
      q: t("pf_cost_q", lang),
      a: hasUnit
        ? tf("pf_cost_a", lang, { price, unit: place.price_unit })
        : tf("pf_cost_a_nounit", lang, { price }),
    });
  }

  // Popularity / reviews.
  if (place.review_count && place.rating) {
    faqs.push({
      q: tf("pf_pop_q", lang, { name }),
      a:
        tf("pf_pop_a", lang, {
          name,
          count: place.review_count.toLocaleString(),
          rating: place.rating.toFixed(1),
        }) + (place.is_partner ? t("pf_pop_partner", lang) : ""),
    });
  }

  // Beginner-friendly.
  if (place.is_beginner_friendly) {
    faqs.push({ q: tf("pf_beg_q", lang, { name }), a: tf("pf_beg_a", lang, { name }) });
  }

  // 24h.
  if (place.is_open_24h) {
    faqs.push({ q: tf("pf_24h_q", lang, { name }), a: tf("pf_24h_a", lang, { name }) });
  }

  return faqs;
}
