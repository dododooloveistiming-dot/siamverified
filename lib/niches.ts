import type { Lang, Niche } from "@/lib/types";

// Korea-first ordering: lead with the niches Korean travelers to Thailand
// search for most (spa/massage, muay thai, diving certs, cooking classes).
// Other languages keep the original order. No niche is removed.
const KO_PRIORITY: Niche[] = ["spa", "muay-thai", "diving", "cooking", "wellness", "yoga-pilates", "coworking"];
const DEFAULT_ORDER: Niche[] = ["muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking"];

export function orderedNiches(lang: Lang): Niche[] {
  return lang === "ko" ? KO_PRIORITY : DEFAULT_ORDER;
}

const KO_POPULAR = new Set<Niche>(["spa", "muay-thai", "diving", "cooking"]);

export function isKoreanPopular(niche: Niche): boolean {
  return KO_POPULAR.has(niche);
}
