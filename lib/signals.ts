import "server-only";
import fs from "node:fs";
import path from "node:path";

// Raw shapes (per scripts/enrich_*.py outputs)
type WaybackRec = {
  domain: string;
  ok: boolean;
  first_capture: string;     // "YYYY-MM-DD"
  first_capture_ts: string;
  age_days: number | null;
  age_years: number | null;
  no_captures: boolean;
};
type DnsRec = {
  domain: string;
  mx: string[];
  provider: string;          // google | microsoft365 | zoho | proton | fastmail | self_hosted | other | none
  professional: boolean;
};
type RecencyRec = {
  last_review_date: string;
  days_since_last_review: number | null;
  reviews_last_30d: number;
  reviews_last_90d: number;
  reviews_last_365d: number;
  active_90d: boolean;
  active_365d: boolean;
};
type YoutubeRec = {
  ok: boolean;
  title: string;
  channel_id: string;
  subscribers: number | null;
  views: number | null;
};
type WhoisRec = {
  ok: boolean;
  registered: string;
  expires: string;           // ISO datetime
  registrar: string;
  age_days: number;
  age_years: number;
};
type VerifRec = {
  sha?: { level: string; cert_id: string; date: string; category: string; name_en: string };
  tat_attraction?: { kind: string; name_en: string; province_th: string };
  tat_restaurant?: { kind: string; name_en: string; province_th: string };
};
type LineRec = {
  handle: string;
  url: string;
  alive: boolean;
  oa_id: string;
  qr_url: string;
  og_image: string;
};
type InstagramRec = {
  handle: string;
  url: string;
  ok: boolean;
  followers: number | null;
  is_verified: boolean;
};

type Caches = {
  wayback:   Record<string, WaybackRec>   | null;
  dns:       Record<string, DnsRec>       | null;
  recency:   Record<string, RecencyRec>   | null;
  youtube:   Record<string, YoutubeRec>   | null;
  whois:     Record<string, WhoisRec>     | null;
  verif:     Record<string, VerifRec>     | null;
  line:      Record<string, LineRec>      | null;
  instagram: Record<string, InstagramRec> | null;
};
const caches: Caches = { wayback: null, dns: null, recency: null, youtube: null, whois: null, verif: null, line: null, instagram: null };

function loadFile<T>(name: string): Record<string, T> {
  const p = path.join(process.cwd(), "public", "data", name);
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return {}; }
}

// Display-ready composed signals
export type PlaceSignals = {
  foundingYear: number | null;       // from wayback first_capture
  ageYears: number | null;
  ageTier: "veteran" | "established" | "newer" | null; // 10y+ / 5y+ / else
  emailProvider: "google" | "microsoft365" | "zoho" | "proton" | "fastmail" | null;
  recencyTier: "very_active" | "active" | "quiet" | null; // 30d / 90d / 365d
  recencyDaysSince: number | null;
  reviews30d: number;
  reviews90d: number;
  reviews365d: number;
  youtube: { subs: number; channelId: string; url: string } | null; // only if ≥5k subs
  // New signals
  whoisExpiryYear: number | null;    // domain paid-up until this year
  govCert: { type: "sha"; certId: string; level: string } | { type: "tat"; kind: string } | null;
  lineQrUrl: string | null;          // LINE Official Account QR image URL
  instagram: { handle: string; followers: number; url: string } | null; // only if ≥1k followers
};

const PRO_PROVIDERS = new Set(["google", "microsoft365", "zoho", "proton", "fastmail"]);

export function getPlaceSignals(placeId: string): PlaceSignals {
  if (caches.wayback === null) caches.wayback = loadFile<WaybackRec>("per_place_wayback.json");
  if (caches.dns === null)     caches.dns     = loadFile<DnsRec>("per_place_dns.json");
  if (caches.recency === null) caches.recency = loadFile<RecencyRec>("per_place_recency.json");
  if (caches.youtube === null) caches.youtube = loadFile<YoutubeRec>("per_place_youtube.json");
  if (caches.whois === null)     caches.whois     = loadFile<WhoisRec>("per_place_whois.json");
  if (caches.verif === null)     caches.verif     = loadFile<VerifRec>("per_place_verifications.json");
  if (caches.line === null)      caches.line      = loadFile<LineRec>("per_place_line.json");
  if (caches.instagram === null) caches.instagram = loadFile<InstagramRec>("per_place_instagram.json");

  const wb = caches.wayback[placeId];
  const dn = caches.dns[placeId];
  const rc = caches.recency[placeId];
  const yt = caches.youtube[placeId];
  const wh = caches.whois[placeId];
  const vf = caches.verif[placeId];
  const ln = caches.line[placeId];
  const ig = caches.instagram[placeId];

  let foundingYear: number | null = null;
  let ageYears: number | null = null;
  let ageTier: PlaceSignals["ageTier"] = null;
  if (wb?.first_capture && wb.age_years != null) {
    foundingYear = parseInt(wb.first_capture.slice(0, 4), 10) || null;
    ageYears = wb.age_years;
    if (ageYears >= 10) ageTier = "veteran";
    else if (ageYears >= 5) ageTier = "established";
    else if (ageYears >= 1) ageTier = "newer";
  }

  const emailProvider =
    dn && PRO_PROVIDERS.has(dn.provider)
      ? (dn.provider as PlaceSignals["emailProvider"])
      : null;

  let recencyTier: PlaceSignals["recencyTier"] = null;
  let recencyDaysSince: number | null = null;
  let reviews30d = 0, reviews90d = 0, reviews365d = 0;
  if (rc) {
    recencyDaysSince = rc.days_since_last_review;
    reviews30d = rc.reviews_last_30d ?? 0;
    reviews90d = rc.reviews_last_90d ?? 0;
    reviews365d = rc.reviews_last_365d ?? 0;
    if (rc.reviews_last_30d > 0) recencyTier = "very_active";
    else if (rc.active_90d) recencyTier = "active";
    else if (rc.active_365d) recencyTier = "quiet";
  }

  let youtube: PlaceSignals["youtube"] = null;
  if (yt?.ok && yt.subscribers && yt.subscribers >= 5000 && yt.channel_id) {
    youtube = {
      subs: yt.subscribers,
      channelId: yt.channel_id,
      url: `https://www.youtube.com/channel/${yt.channel_id}`,
    };
  }

  let whoisExpiryYear: number | null = null;
  if (wh?.ok && wh.expires) {
    const y = parseInt(wh.expires.slice(0, 4), 10);
    if (y > new Date().getFullYear()) whoisExpiryYear = y;
  }

  let govCert: PlaceSignals["govCert"] = null;
  if (vf?.sha) {
    govCert = { type: "sha", certId: vf.sha.cert_id, level: vf.sha.level };
  } else if (vf?.tat_attraction) {
    govCert = { type: "tat", kind: vf.tat_attraction.kind };
  } else if (vf?.tat_restaurant) {
    govCert = { type: "tat", kind: vf.tat_restaurant.kind };
  }

  const lineQrUrl = (ln?.alive && ln.qr_url) ? ln.qr_url : null;

  const instagram =
    ig?.ok && ig.followers && ig.followers >= 1000
      ? { handle: ig.handle, followers: ig.followers, url: ig.url }
      : null;

  return { foundingYear, ageYears, ageTier, emailProvider, recencyTier, recencyDaysSince, reviews30d, reviews90d, reviews365d, youtube, whoisExpiryYear, govCert, lineQrUrl, instagram };
}

// Display helpers
export function emailProviderLabel(p: NonNullable<PlaceSignals["emailProvider"]>): string {
  return ({
    google: "Google Workspace",
    microsoft365: "Microsoft 365",
    zoho: "Zoho Mail",
    proton: "Proton Mail",
    fastmail: "Fastmail",
  } as const)[p];
}

export function formatSubs(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

// Trust boost applied on top of the base trust_score from places.json.
// Capped at +25 so even max-boosted weak places (e.g. base 50 + 25 = 75) sit
// below well-reviewed venues (base 90+). Veteran + active is the strongest
// combined real-world signal we can prove without manual verification.
export function computeTrustBoost(s: PlaceSignals): number {
  let b = 0;
  if (s.ageTier === "veteran") b += 12;
  else if (s.ageTier === "established") b += 6;
  if (s.recencyTier === "very_active") b += 10;
  if (s.emailProvider) b += 5;
  if (s.youtube) b += 3;
  if (s.govCert) b += 8;
  return Math.min(25, b);
}

export type TrustBreakdownItem = { label: string; pts: number };

// Returns the boost components in display order. Used for the tooltip on
// place cards/detail badges so users see WHY a venue scored what it did.
export function trustBreakdown(s: PlaceSignals): TrustBreakdownItem[] {
  const items: TrustBreakdownItem[] = [];
  if (s.ageTier === "veteran") items.push({ label: "Veteran (10y+ online)", pts: 12 });
  else if (s.ageTier === "established") items.push({ label: "Established (5y+ online)", pts: 6 });
  if (s.recencyTier === "very_active") items.push({ label: "Active in last 30d", pts: 10 });
  if (s.emailProvider) items.push({ label: `Pro email (${emailProviderLabel(s.emailProvider)})`, pts: 5 });
  if (s.youtube) items.push({ label: "YouTube channel ≥5k subs", pts: 3 });
  if (s.govCert?.type === "sha") items.push({ label: `Thailand SHA certified (${s.govCert.certId})`, pts: 8 });
  else if (s.govCert?.type === "tat") items.push({ label: "TAT registered business", pts: 8 });
  return items;
}
