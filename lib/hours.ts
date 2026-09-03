// Opening-hours parsing, shared by scripts/import-apify-hours.mjs (which
// builds the sidecar) and lib/data.ts (which reads it).
//
// Background: Place.is_open_24h and Place.opening_hours_json have been false
// and "" for all 3,347 venues since the field was introduced.
// scripts/build-data.mjs reads `r.is_open_24h` and `r.opening_hours_json` off
// the master CSV row, and neither column has ever existed in any of the seven
// masters — `bool(undefined)` is false, every time. The "🌙 24h" filter has
// therefore never matched anything. Nothing regressed; the wiring was never
// connected to a source.
//
// The one place hours were ever fetched — enrich_place_details.py asks Google
// for regularOpeningHours.weekdayDescriptions — writes to a cache under
// public/data/_raw/ that doesn't exist, and build-data.mjs reads only
// websiteUri/phone/businessStatus back out of it. OSM's osm_opening_hours
// column is populated on 5 rows out of 22,151, none of them 24/7.
//
// So hours now arrive as their own sidecar, per_place_hours.json, and are
// applied in loadPlaces() alongside the other derived signals rather than
// being baked in by the CSV build.

export type DayHours = { day: string; hours: string };

export type HoursRecord = {
  /** Raw per-day strings, as scraped. Rendered as-is. */
  days: DayHours[];
  /** True only when every listed day is round-the-clock. */
  open_24h: boolean;
  source: string;
  fetched_at?: string;
};

// "Open 24 hours" (Google/Apify, en), "24 hours", "24/7" (OSM),
// "เปิดตลอด 24 ชั่วโมง" (th), "24時間営業" (ja), "24小时营业" (zh),
// "24시간 영업" (ko). Matching on the numeral plus a round-the-clock word
// keeps this readable without a locale table.
const TWENTY_FOUR = /(^|[^0-9])24\s*(\/\s*7|h(ou)?rs?\b|시간|小时|小時|時間|ชั่วโมง)/i;

// Explicitly-closed days must not count as "round the clock".
const CLOSED = /\b(closed|ปิด|休|휴무|geschlossen)\b/i;

export function isTwentyFourHours(hours: string): boolean {
  const s = String(hours || "").trim();
  if (!s || CLOSED.test(s)) return false;
  return TWENTY_FOUR.test(s);
}

/**
 * A venue counts as 24h only when every day it lists is round-the-clock.
 * A place open all night on Fridays alone is not what someone filtering for
 * "24 hours" is looking for, and claiming otherwise is the kind of thing this
 * site exists not to do.
 */
export function allDaysTwentyFour(days: DayHours[]): boolean {
  if (!days || days.length < 7) return false;
  return days.every((d) => isTwentyFourHours(d.hours));
}

/**
 * Serialize for Place.opening_hours_json.
 *
 * app/[lang]/place/[slug]/page.tsx parses that field as Record<string,string>
 * and renders it with Object.entries — a shape that predates any data ever
 * reaching it. Keep to it: the sidecar stores an ordered array because
 * Monday-first display order matters, and this flattens to the record the
 * page wants. (Object key order follows insertion for string keys, which is
 * what that page has always relied on.)
 */
export function toHoursMap(days: DayHours[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of days) {
    if (d.day && d.hours) out[d.day] = d.hours;
  }
  return out;
}
