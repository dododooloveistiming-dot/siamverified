import type { Lang, Loc, Niche } from "./types";

// Collections are the searches people actually make that our seven `Niche`
// buckets hide. "Sauna" and "pilates" are the ones this site keeps getting
// asked for after they trend on Instagram/TikTok, and today they sit inside
// `spa` (2,000 venues) and `yoga-pilates` (284) with no way to reach them.
//
// They are derived, not stored: adding a `Niche` member means re-running the
// whole scrape → CSV → build-data pipeline and re-classifying every venue.
// A keyword view over the existing data gets the landing pages now, and stays
// correct as the dataset grows.
//
// Matching uses only the venue's own name and its Google category — not
// review text. Review text roughly doubles recall while dragging in venues a
// reviewer merely *mentioned* a sauna at, and "verified" is the entire brand.

export type CollectionSlug =
  | "sauna"
  | "pilates"
  | "yoga"
  | "thai-massage"
  | "hot-spring"
  | "meditation"
  | "freediving"
  | "ice-bath";

export type CollectionDef = {
  slug: CollectionSlug;
  emoji: string;
  /** Niches worth scanning — narrows a 3,347-place sweep to the plausible set. */
  niches: Niche[];
  patterns: RegExp[];
  name: Loc<string>;
};

export const COLLECTIONS: CollectionDef[] = [
  {
    slug: "sauna",
    emoji: "🧖",
    niches: ["spa", "wellness"],
    patterns: [/\bsaunas?\b/i, /infrared\s*sauna/i, /steam\s*room/i, /\bonsen\b/i, /banya/i],
    name: {
      en: "Sauna", ko: "사우나", th: "ซาวน่า", zh: "桑拿", ja: "サウナ",
      id: "Sauna", vi: "Phòng xông hơi", ar: "ساونا",
    },
  },
  {
    slug: "ice-bath",
    emoji: "🧊",
    niches: ["wellness", "spa", "muay-thai"],
    patterns: [/ice\s*bath/i, /cold\s*plunge/i, /\bcryo/i, /cold\s*therapy/i, /ice\s*barrel/i, /contrast\s*therapy/i],
    name: {
      en: "Ice bath & cold plunge", ko: "아이스배스·냉수욕", th: "ไอซ์บาธ", zh: "冰浴", ja: "アイスバス",
      id: "Ice bath", vi: "Tắm đá lạnh", ar: "حمام الثلج",
    },
  },
  {
    slug: "pilates",
    emoji: "🤸",
    niches: ["yoga-pilates", "wellness"],
    patterns: [/\bpilates\b/i, /\breformer\b/i],
    name: {
      en: "Pilates", ko: "필라테스", th: "พิลาทิส", zh: "普拉提", ja: "ピラティス",
      id: "Pilates", vi: "Pilates", ar: "بيلاتس",
    },
  },
  {
    slug: "yoga",
    emoji: "🧘",
    niches: ["yoga-pilates", "wellness"],
    patterns: [/\byoga\b/i, /vinyasa/i, /ashtanga/i, /\bhatha\b/i],
    name: {
      en: "Yoga", ko: "요가", th: "โยคะ", zh: "瑜伽", ja: "ヨガ",
      id: "Yoga", vi: "Yoga", ar: "يوغا",
    },
  },
  {
    slug: "thai-massage",
    emoji: "💆",
    niches: ["spa", "wellness"],
    patterns: [/thai\s*massage/i, /นวดไทย/, /traditional\s*massage/i],
    name: {
      en: "Traditional Thai massage", ko: "전통 타이 마사지", th: "นวดแผนไทย", zh: "泰式古法按摩", ja: "タイ古式マッサージ",
      id: "Pijat tradisional Thailand", vi: "Massage Thái cổ truyền", ar: "المساج التايلاندي التقليدي",
    },
  },
  {
    slug: "hot-spring",
    emoji: "♨️",
    niches: ["spa", "wellness"],
    patterns: [/hot\s*springs?\b/i, /น้ำพุร้อน/, /\bonsen\b/i],
    name: {
      en: "Hot spring", ko: "온천", th: "น้ำพุร้อน", zh: "温泉", ja: "温泉",
      id: "Sumber air panas", vi: "Suối nước nóng", ar: "الينابيع الساخنة",
    },
  },
  {
    slug: "meditation",
    emoji: "🕉️",
    niches: ["wellness", "yoga-pilates"],
    // Thai listings rarely use the English words: สำนักปฏิบัติธรรม is
    // literally "dharma practice centre". `retreat cent` is in scope because
    // the collection is Meditation & retreat. Buddhist temples are
    // deliberately NOT matched — most Thai wat run no public meditation
    // programme, and 25 of them would have been padding, not members.
    patterns: [/meditation/i, /vipassana/i, /mindfulness/i, /ปฏิบัติธรรม/, /วิปัสสนา/, /retreat\s*cent/i],
    name: {
      en: "Meditation & retreat", ko: "명상·리트릿", th: "สมาธิและรีทรีต", zh: "冥想与静修", ja: "瞑想・リトリート",
      id: "Meditasi & retret", vi: "Thiền & retreat", ar: "التأمل والخلوات",
    },
  },
  {
    slug: "freediving",
    emoji: "🌊",
    niches: ["diving"],
    patterns: [/freediv/i, /free\s*div/i, /\bapnea\b/i],
    name: {
      en: "Freediving", ko: "프리다이빙", th: "ฟรีไดฟ์วิ่ง", zh: "自由潜水", ja: "フリーダイビング",
      id: "Freediving", vi: "Lặn tự do", ar: "الغوص الحر",
    },
  },
];

const BY_SLUG = new Map(COLLECTIONS.map((c) => [c.slug, c]));

export function getCollection(slug: string): CollectionDef | undefined {
  return BY_SLUG.get(slug as CollectionSlug);
}

export function collectionName(c: CollectionDef, lang: Lang): string {
  return c.name[lang] ?? c.name.en;
}

