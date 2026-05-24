import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlaces } from "@/lib/data";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import type { Lang, Niche, Place } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import PlacePlaceholder from "@/components/PlacePlaceholder";

export const dynamic = "force-static";

// ─── City definitions ────────────────────────────────────────────────

type CityDef = {
  slug: string;
  label: string;
  matches: string[];
  emoji: string;
  vibe: string;
};

const CITIES: CityDef[] = [
  {
    slug: "bangkok",
    label: "Bangkok",
    matches: ["bangkok"],
    emoji: "🏙️",
    vibe: "Fast-paced megacity, 11M people, top international hub",
  },
  {
    slug: "chiang-mai",
    label: "Chiang Mai",
    matches: ["chiang mai", "chiangmai"],
    emoji: "🏔️",
    vibe: "Mountain town, digital nomad capital, slower pace",
  },
  {
    slug: "phuket",
    label: "Phuket",
    matches: ["phuket"],
    emoji: "🏝️",
    vibe: "Largest Thai island, big beach resorts, year-round destination",
  },
  {
    slug: "koh-tao",
    label: "Koh Tao",
    matches: ["koh tao"],
    emoji: "🤿",
    vibe: "Tiny dive island, world's busiest dive cert hub",
  },
  {
    slug: "koh-samui",
    label: "Koh Samui",
    matches: ["koh samui", "samui"],
    emoji: "🌴",
    vibe: "Gulf island, mid-tier resort vibe, wellness retreats",
  },
  {
    slug: "pattaya",
    label: "Pattaya",
    matches: ["pattaya"],
    emoji: "🏖️",
    vibe: "Coastal city, easy from Bangkok, nightlife-heavy",
  },
  {
    slug: "hua-hin",
    label: "Hua Hin",
    matches: ["hua hin", "huahin"],
    emoji: "🌅",
    vibe: "Royal seaside town, golf and quiet retreats",
  },
];

// Pre-defined comparison pairs (avoid combinatorial explosion).
const COMPARE_PAIRS: Array<[string, string]> = [
  ["bangkok", "chiang-mai"],
  ["phuket", "koh-tao"],
  ["bangkok", "phuket"],
  ["chiang-mai", "pattaya"],
  ["bangkok", "koh-samui"],
  ["pattaya", "hua-hin"],
  ["phuket", "koh-samui"],
];

function parsePair(slug: string): { a: CityDef; b: CityDef } | null {
  const match = slug.match(/^([a-z-]+)-vs-([a-z-]+)$/);
  if (!match) return null;
  const a = CITIES.find((c) => c.slug === match[1]);
  const b = CITIES.find((c) => c.slug === match[2]);
  if (!a || !b) return null;
  return { a, b };
}

function placesInCity(places: Place[], city: CityDef): Place[] {
  return places.filter((p) => {
    const c = (p.city || "").toLowerCase();
    return city.matches.some((m) => c === m || c.includes(m));
  });
}

const NICHE_LIST: Niche[] = [
  "muay-thai",
  "yoga-pilates",
  "wellness",
  "cooking",
  "diving",
  "spa",
  "coworking",
];

export function generateStaticParams() {
  const params: Array<{ lang: Lang; slug: string }> = [];
  for (const lang of SUPPORTED_LANGS) {
    for (const [a, b] of COMPARE_PAIRS) {
      params.push({ lang, slug: `${a}-vs-${b}` });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Lang; slug: string };
}): Promise<Metadata> {
  const parsed = parsePair(params.slug);
  if (!parsed) return {};
  const { a, b } = parsed;
  const url = `${SITE.origin}/${params.lang}/compare/${params.slug}/`;
  return {
    title: `${a.label} vs ${b.label} — yoga, spa, diving, coworking compared · ${SITE.name}`,
    description: `Side-by-side comparison of ${a.label} and ${b.label} across yoga retreats, spa, muay thai, diving, cooking, and digital nomad life. Built from cross-checked listings, not paid placements.`,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/compare/${params.slug}/`]),
      ),
    },
    openGraph: {
      title: `${a.label} vs ${b.label}`,
      description: `Compare ${a.label} and ${b.label} for wellness, retreats, and digital nomad life.`,
      url,
      type: "article",
    },
  };
}

export default function ComparePage({
  params,
}: {
  params: { lang: Lang; slug: string };
}) {
  const parsed = parsePair(params.slug);
  if (!parsed) notFound();
  const { a, b } = parsed;
  const lang = params.lang;
  const bundle = loadPlaces();

  const aPlaces = placesInCity(bundle.places, a);
  const bPlaces = placesInCity(bundle.places, b);

  const stats = (places: Place[]) => {
    const koCount = places.filter((p) => p.languages.ko).length;
    const beginnerCount = places.filter((p) => p.is_beginner_friendly).length;
    const avgRating =
      places.filter((p) => p.rating != null).reduce((s, p) => s + (p.rating ?? 0), 0) /
        Math.max(places.filter((p) => p.rating != null).length, 1) || 0;
    const avgTrust =
      places.reduce((s, p) => s + p.trust_score, 0) / Math.max(places.length, 1) || 0;
    const niches = NICHE_LIST.map((n) => ({
      niche: n,
      count: places.filter((p) => p.niche === n).length,
    }));
    return { count: places.length, koCount, beginnerCount, avgRating, avgTrust, niches };
  };

  const aStats = stats(aPlaces);
  const bStats = stats(bPlaces);

  // Top-3 places per city by trust
  const aTop = [...aPlaces].sort((x, y) => y.trust_score - x.trust_score).slice(0, 3);
  const bTop = [...bPlaces].sort((x, y) => y.trust_score - x.trust_score).slice(0, 3);

  return (
    <main className="pb-20">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-amber-900 py-12 text-white sm:py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4">
          <nav className="text-xs text-white/80">
            <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
            <span className="mx-2">/</span>
            <span>Compare</span>
          </nav>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
            <span>{a.emoji} {a.label}</span>
            <span className="mx-2 text-white/60">vs</span>
            <span>{b.emoji} {b.label}</span>
          </h1>
          <p className="mt-3 max-w-3xl text-base text-white/90 sm:text-lg">
            Side-by-side comparison across wellness, spa, muay thai, yoga, diving, cooking, and digital nomad life.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* CITY OVERVIEW */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CityOverviewCard city={a} stats={aStats} />
          <CityOverviewCard city={b} stats={bStats} />
        </section>

        {/* NICHE COMPARISON TABLE */}
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">By category</h2>
          <p className="mt-1 text-sm muted">
            Number of verified places per niche in each city.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left dark:border-ink-700">
                  <th className="px-3 py-2 font-semibold">Niche</th>
                  <th className="px-3 py-2 font-semibold text-right">{a.emoji} {a.label}</th>
                  <th className="px-3 py-2 font-semibold text-right">{b.emoji} {b.label}</th>
                  <th className="px-3 py-2 font-semibold text-right muted">Winner</th>
                </tr>
              </thead>
              <tbody>
                {NICHE_LIST.map((n) => {
                  const aN = aStats.niches.find((x) => x.niche === n)?.count ?? 0;
                  const bN = bStats.niches.find((x) => x.niche === n)?.count ?? 0;
                  const winner = aN === bN ? "" : aN > bN ? a.label : b.label;
                  const meta = NICHE_META[n];
                  return (
                    <tr key={n} className="border-b border-ink-100 dark:border-ink-800">
                      <td className="px-3 py-3">
                        <Link
                          href={`/${lang}/c/${n}/`}
                          className="font-medium hover:underline"
                        >
                          {meta.emoji} {nicheName(n, lang)}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums">{aN}</td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums">{bN}</td>
                      <td className="px-3 py-3 text-right text-xs muted">{winner || "—"}</td>
                    </tr>
                  );
                })}
                <tr className="border-b-2 border-emerald-300 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-950/20">
                  <td className="px-3 py-3 font-bold">Total verified places</td>
                  <td className="px-3 py-3 text-right font-black tabular-nums">{aStats.count}</td>
                  <td className="px-3 py-3 text-right font-black tabular-nums">{bStats.count}</td>
                  <td className="px-3 py-3 text-right text-xs muted">
                    {aStats.count > bStats.count ? a.label : aStats.count < bStats.count ? b.label : "Tie"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* TOP 3 PLACES PER CITY */}
        <section className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-bold">
              {a.emoji} Top 3 in {a.label}
            </h2>
            <ul className="space-y-2">
              {aTop.map((p) => <PlaceMiniRow key={p.id} place={p} lang={lang} />)}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-lg font-bold">
              {b.emoji} Top 3 in {b.label}
            </h2>
            <ul className="space-y-2">
              {bTop.map((p) => <PlaceMiniRow key={p.id} place={p} lang={lang} />)}
            </ul>
          </div>
        </section>

        {/* RELATED COMPARISONS */}
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-bold">Other comparisons</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {COMPARE_PAIRS.filter(([x, y]) => `${x}-vs-${y}` !== params.slug)
              .slice(0, 6)
              .map(([x, y]) => {
                const cx = CITIES.find((c) => c.slug === x)!;
                const cy = CITIES.find((c) => c.slug === y)!;
                return (
                  <Link
                    key={`${x}-${y}`}
                    href={`/${lang}/compare/${x}-vs-${y}/`}
                    className="rounded-xl border border-ink-100 bg-white p-3 text-sm hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
                  >
                    {cx.emoji} {cx.label} vs {cy.emoji} {cy.label}
                  </Link>
                );
              })}
          </div>
        </section>

        <div className="mt-10 text-xs muted">
          <Link href={`/${lang}/`} className="hover:underline">← Home</Link>
        </div>
      </div>
    </main>
  );
}

type CityStats = {
  count: number;
  koCount: number;
  beginnerCount: number;
  avgRating: number;
  avgTrust: number;
  niches: Array<{ niche: Niche; count: number }>;
};

function CityOverviewCard({ city, stats }: { city: CityDef; stats: CityStats }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <div className="text-4xl">{city.emoji}</div>
      <h2 className="mt-2 text-xl font-black tracking-tight">{city.label}</h2>
      <p className="mt-1 text-sm muted">{city.vibe}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <Stat label="Verified places" value={stats.count} />
        <Stat label="Avg Trust" value={Math.round(stats.avgTrust)} />
        <Stat label="Avg ★" value={stats.avgRating.toFixed(1)} />
        <Stat label="🇰🇷 Korean-friendly" value={stats.koCount} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide muted">{label}</dt>
      <dd className="text-base font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function PlaceMiniRow({ place, lang }: { place: Place; lang: Lang }) {
  return (
    <li>
      <Link
        href={`/${lang}/place/${place.slug}/`}
        className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-2 transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-50 dark:bg-ink-800">
          {place.top_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={place.top_photo_url} alt={place.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <PlacePlaceholder niche={place.niche} size="sm" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{place.name}</div>
          <div className="text-[11px] muted">{nicheName(place.niche, lang)} · Trust {place.trust_score}</div>
        </div>
      </Link>
    </li>
  );
}
