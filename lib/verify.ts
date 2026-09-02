// Client-side lookup for /[lang]/verify/ — "I saw this place on Instagram or
// TikTok, is it real?" Everything here runs in the browser against
// public/data/handles.json (scripts/build-handles.mjs), so the whole feature
// costs zero server compute.

export type HandleIndex = {
  v: number;
  generated_at: string;
  // [slug, name, city, niche, trust, rating, reviewCount, sourceCount, flags]
  p: Array<[string, string, string, string, number, number, number, number, number]>;
  ig: Record<string, number>;
  tt: Record<string, number>;
  fb: Record<string, number>;
  yt: Record<string, number>;
  ln: Record<string, number>;
  w: Record<string, number>;
};

export type Platform = "ig" | "tt" | "fb" | "yt" | "ln" | "w";

// Resolved server-side by app/[lang]/verify/page.tsx and passed to
// components/VerifyBox.tsx as a prop. VerifyBox imports only this type
// (erased at compile time), never lib/i18n -- same bundle-size reason as
// CategoryStrings. See resolveVerifyStrings() in lib/i18n.ts.
export type VerifyStrings = {
  placeholder: string;
  loading: string;
  checking: string;
  verifiedTitle: string;
  viaLabel: Record<Platform, string>;
  sourcesLine: string;
  googleLine: string;
  noRating: string;
  fullReport: string;
  maybeTitle: string;
  maybeSub: string;
  unknownTitle: string;
  unknownSub: string;
  unknownChecked: string;
  browseAll: string;
  flag: {
    veteran: string;
    established: string;
    veryActive: string;
    active: string;
    viral: string;
    govCert: string;
  };
};

export const FLAG = {
  VETERAN: 1,
  ESTABLISHED: 2,
  VERY_ACTIVE: 4,
  ACTIVE: 8,
  VIRAL: 16,
  WEBSITE: 32,
  GOV_CERT: 64,
} as const;

export type VerifyHit = {
  slug: string;
  name: string;
  city: string;
  niche: string;
  trust: number;
  rating: number;
  reviewCount: number;
  sourceCount: number;
  flags: number;
};

export type VerifyResult =
  | { kind: "exact"; via: Platform; query: string; hit: VerifyHit }
  | { kind: "name"; query: string; hits: VerifyHit[] }
  | { kind: "unknown"; query: string; parsed: ParsedInput };

// ── input parsing ────────────────────────────────────────────────────────

export type ParsedInput = { platform: Platform | null; key: string; raw: string };

// Normalizers mirror scripts/build-handles.mjs. Change one, change both.
export function normHandle(s: string): string {
  return String(s || "").trim().toLowerCase()
    .replace(/^@+/, "")
    .replace(/\/+$/, "")
    .replace(/[^a-z0-9._-]/g, "");
}

export function normDomain(s: string): string {
  return String(s || "").trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0];
}

export function normName(s: string): string {
  return String(s || "").toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9฀-๿]+/g, " ")
    .trim();
}

// Recognizes what someone actually pastes: a full profile URL copied from the
// app's share sheet, a bare @handle, or a website. Anything else falls
// through to a name search.
const URL_PATTERNS: Array<[Platform, RegExp]> = [
  ["ig", /instagram\.com\/(?:p\/|reel\/|reels\/)?@?([A-Za-z0-9._]+)/i],
  ["tt", /tiktok\.com\/@([A-Za-z0-9._]+)/i],
  ["fb", /(?:facebook\.com|fb\.com|fb\.me)\/(?:profile\.php\?id=)?([A-Za-z0-9._-]+)/i],
  ["yt", /youtube\.com\/(?:@|c\/|channel\/|user\/)([A-Za-z0-9._-]+)/i],
  ["ln", /(?:line\.me\/(?:R\/)?ti\/p\/|lin\.ee\/)@?([A-Za-z0-9._-]+)/i],
];

export function parseInput(raw: string): ParsedInput {
  const s = String(raw || "").trim();
  if (!s) return { platform: null, key: "", raw: s };

  for (const [platform, re] of URL_PATTERNS) {
    const m = s.match(re);
    if (m) return { platform, key: normHandle(m[1]), raw: s };
  }

  // A bare @handle could be Instagram or TikTok — the caller tries both.
  if (/^@[A-Za-z0-9._]+$/.test(s)) return { platform: "ig", key: normHandle(s), raw: s };

  // Looks like a URL or bare domain we didn't recognize as a social profile
  if (/^https?:\/\//i.test(s) || /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(s)) {
    return { platform: "w", key: normDomain(s), raw: s };
  }

  return { platform: null, key: normName(s), raw: s };
}

// ── lookup ───────────────────────────────────────────────────────────────

function toHit(idx: HandleIndex, i: number): VerifyHit {
  const r = idx.p[i];
  return {
    slug: r[0], name: r[1], city: r[2], niche: r[3],
    trust: r[4], rating: r[5], reviewCount: r[6], sourceCount: r[7], flags: r[8],
  };
}

// Built lazily from idx.p rather than shipped — see build-handles.mjs.
let nameCache: { idx: HandleIndex; map: Map<string, number[]> } | null = null;
function nameMap(idx: HandleIndex): Map<string, number[]> {
  if (nameCache?.idx === idx) return nameCache.map;
  const map = new Map<string, number[]>();
  idx.p.forEach((r, i) => {
    const n = normName(r[1]);
    if (!n) return;
    const bucket = map.get(n);
    if (bucket) bucket.push(i);
    else map.set(n, [i]);
  });
  nameCache = { idx, map };
  return map;
}

const NAME_LIMIT = 6;

export function lookup(idx: HandleIndex, raw: string): VerifyResult | null {
  const parsed = parseInput(raw);
  if (!parsed.key) return null;

  // Exact handle/domain match — the confident path.
  const order: Platform[] =
    parsed.platform === "ig" ? ["ig", "tt", "fb", "yt"]   // bare @handle: try the likely ones
    : parsed.platform ? [parsed.platform]
    : [];
  for (const platform of order) {
    const i = idx[platform][parsed.key];
    if (i !== undefined) return { kind: "exact", via: platform, query: parsed.raw, hit: toHit(idx, i) };
  }

  // Name search — exact normalized name first, then substring. A handle that
  // missed above often still matches a venue name ("@yogaelements" ->
  // "Yoga Elements Studio"), so try the handle's letters too.
  const needle = parsed.platform ? normName(parsed.key.replace(/[._-]+/g, " ")) : parsed.key;
  if (needle) {
    const exact = nameMap(idx).get(needle);
    if (exact?.length) {
      return { kind: "name", query: parsed.raw, hits: exact.slice(0, NAME_LIMIT).map((i) => toHit(idx, i)) };
    }
    if (needle.length >= 3) {
      const compact = needle.replace(/\s+/g, "");
      const partial: number[] = [];
      for (let i = 0; i < idx.p.length && partial.length < NAME_LIMIT * 4; i++) {
        const n = normName(idx.p[i][1]);
        if (n.includes(needle) || n.replace(/\s+/g, "").includes(compact)) partial.push(i);
      }
      if (partial.length) {
        // Best-scored first — trust score is the site's whole premise.
        const hits = partial.map((i) => toHit(idx, i)).sort((a, b) => b.trust - a.trust);
        return { kind: "name", query: parsed.raw, hits: hits.slice(0, NAME_LIMIT) };
      }
    }
  }

  return { kind: "unknown", query: parsed.raw, parsed };
}
