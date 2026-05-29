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

type Caches = {
  wayback: Record<string, WaybackRec> | null;
  dns: Record<string, DnsRec> | null;
  recency: Record<string, RecencyRec> | null;
  youtube: Record<string, YoutubeRec> | null;
};
const caches: Caches = { wayback: null, dns: null, recency: null, youtube: null };

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
  youtube: { subs: number; channelId: string; url: string } | null; // only if ≥5k subs
};

const PRO_PROVIDERS = new Set(["google", "microsoft365", "zoho", "proton", "fastmail"]);

export function getPlaceSignals(placeId: string): PlaceSignals {
  if (caches.wayback === null) caches.wayback = loadFile<WaybackRec>("per_place_wayback.json");
  if (caches.dns === null)     caches.dns     = loadFile<DnsRec>("per_place_dns.json");
  if (caches.recency === null) caches.recency = loadFile<RecencyRec>("per_place_recency.json");
  if (caches.youtube === null) caches.youtube = loadFile<YoutubeRec>("per_place_youtube.json");

  const wb = caches.wayback[placeId];
  const dn = caches.dns[placeId];
  const rc = caches.recency[placeId];
  const yt = caches.youtube[placeId];

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
  if (rc) {
    recencyDaysSince = rc.days_since_last_review;
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

  return { foundingYear, ageYears, ageTier, emailProvider, recencyTier, recencyDaysSince, youtube };
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
