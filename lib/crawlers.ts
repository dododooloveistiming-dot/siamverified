// Crawler policy — shared by middleware.ts (enforcement) and app/robots.ts
// (declaration) so the two can't drift apart.
//
// Why this exists: only the canonical `en` place route is pre-rendered
// (app/[lang]/place/[slug]/page.tsx explains why — 3,347 places x 8 langs
// overran Vercel's 45-min build limit). Every other language renders on
// first request and writes an ISR entry. At ~0 human traffic that made
// commercial crawlers the dominant cost: they walked ~23,000 cold URLs and
// exhausted the free tier, which is what took the site down (402
// DEPLOYMENT_DISABLED) on 2026-09-02.
//
// Blocked below: SEO backlink/rank tools and content scrapers that send no
// referral traffic back. NOT blocked: search engines (Google, Bing, Naver's
// Yeti, Baidu, Yandex, Sogou, DuckDuckBot), AI assistants that cite sources
// (GPTBot, PerplexityBot, ClaudeBot, Google-Extended), and social preview
// fetchers (facebookexternalhit, Twitterbot) — those are the whole point of
// the multilingual build.
export const BLOCKED_CRAWLERS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "Bytespider",
  "PetalBot",
  "DataForSeoBot",
  "SeekportBot",
  "serpstatbot",
  "ZoominfoBot",
  "Barkrowler",
  "MegaIndex",
  "ImagesiftBot",
  "Amazonbot",
  "SiteAuditBot",
  "AwarioBot",
  "magpie-crawler",
] as const;

const BLOCKED_RE = new RegExp(BLOCKED_CRAWLERS.join("|"), "i");

export function isBlockedCrawler(userAgent: string | null): boolean {
  return !!userAgent && BLOCKED_RE.test(userAgent);
}
