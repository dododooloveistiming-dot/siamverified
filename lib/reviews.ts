import type { Lang, Place } from "@/lib/types";

const THAI_SCRIPT = /[฀-๿]/;

// True when review text is written in Thai script. Used so we don't feature
// an unreadable review on a non-Thai locale page (e.g. an English visitor
// seeing only a Thai-language quote).
export function isThaiText(text: string): boolean {
  return THAI_SCRIPT.test(text);
}

// Strip Google-scrape metadata lines and the owner-reply tail from a raw
// review string, leaving the visitor's actual review body. Display-only —
// stored data keeps the raw text so we never lose information.
export function cleanReviewText(raw: string): string {
  if (!raw) return "";
  let t = raw;
  // Cut everything from the owner-reply marker onward (Thai / English).
  const reply = t.search(/\nคำตอบจากเจ้าของ|\nResponse from the owner|\nคำติชมจาก/);
  if (reply > 0) t = t.slice(0, reply);
  // Drop scrape-metadata lines: reviewer header, "Local Guide · N รีวิว",
  // relative dates, and Like/Share affordances.
  const lines = t
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (/^(Local Guide|ชอบ|แชร์|Like|Share)$/.test(l)) return false;
      if (/^[0-9]*\s*(ปีที่แล้ว|เดือนที่แล้ว|สัปดาห์ที่แล้ว|วันที่แล้ว)$/.test(l)) return false;
      if (/(รีวิว · .*รูปภาพ)|(· \d+ (รีวิว|รูปภาพ|reviews|photos))/.test(l)) return false;
      return true;
    });
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

// Count distinct, substantive Google reviews available for a place,
// based on the cleaned (de-noised) review body.
export function countUniqueGoogleReviews(place: Place): number {
  const seen = new Set<string>();
  let n = 0;
  for (const rv of place.reviews_sample || []) {
    if ((rv.source || "google") !== "google") continue;
    const clean = cleanReviewText(rv.text || "");
    if (clean.length < 30) continue;
    const key = clean.toLowerCase().slice(0, 120);
    if (seen.has(key)) continue;
    seen.add(key);
    n++;
  }
  return n;
}

// Cross-source community mention signals recorded on the place
// (Naver blogs/cafe, Pantip threads, Reddit threads).
export function mentionSignalCount(place: Place): number {
  const b = place.source_badges;
  if (!b) return 0;
  return (b.naver || 0) + (b.pantip || 0) + (b.reddit || 0);
}

// Pick the review quote to feature at the top of the reviews section. On a
// non-Thai locale, prefer a cleaned review that isn't in Thai script over
// `top_review_text` so visitors aren't shown a quote they can't read — but
// never drop the content entirely (falls back to the Thai original with
// `isThai: true` so the caller can label it).
export function pickFeaturedReview(
  place: Place,
  lang: Lang,
): { text: string; isThai: boolean } | null {
  const topClean = cleanReviewText(place.top_review_text || "");
  const topIsThai = topClean.length > 0 && isThaiText(topClean);

  if (lang === "th" || !topIsThai) {
    return topClean ? { text: topClean, isThai: topIsThai } : null;
  }

  for (const rv of place.reviews_sample || []) {
    const clean = cleanReviewText(rv.text || "");
    if (clean.length >= 30 && !isThaiText(clean)) {
      return { text: clean, isThai: false };
    }
  }
  return { text: topClean, isThai: true };
}

// A place is worth indexing when it carries at least two independent
// pieces of real content. Pages below this bar are noindexed so Google's
// crawl + quality budget concentrates on substantive pages.
export function isIndexablePlace(place: Place): boolean {
  const reviews = countUniqueGoogleReviews(place);
  const mentions = mentionSignalCount(place);
  return reviews >= 2 || mentions >= 2 || (reviews >= 1 && mentions >= 1);
}
