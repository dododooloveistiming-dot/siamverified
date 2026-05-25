import type { Metadata } from "next";
import Link from "next/link";
import { loadPlaces, getTopPlacesPerNiche, getTopPlaces, getPlacesByNiche } from "@/lib/data";
import { SITE, SUPPORTED_LANGS, t } from "@/lib/i18n";
import type { Lang, Niche, Place } from "@/lib/types";
import { NICHE_META, nicheName, nicheTagline } from "@/lib/types";
import PlacePlaceholder from "@/components/PlacePlaceholder";

export const dynamic = "force-static";

export async function generateMetadata({ params }: { params: { lang: Lang } }): Promise<Metadata> {
  const { lang } = params;
  const url = `${SITE.origin}/${lang}/`;
  return {
    title: `${SITE.name} — ${t("hero_title", lang)}`,
    description: SITE.tagline[lang],
    alternates: {
      canonical: url,
      languages: Object.fromEntries(SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/`])),
    },
    openGraph: {
      title: `${SITE.name}`,
      description: SITE.tagline[lang],
      url,
      images: [{ url: `${SITE.origin}/og-default.png`, width: 1200, height: 630 }],
    },
  };
}

const NICHES: Niche[] = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
];

const FEATURED_CITIES: Array<{ slug: string; label: string; emoji: string }> = [
  { slug: "bangkok", label: "Bangkok", emoji: "🏙️" },
  { slug: "chiang-mai", label: "Chiang Mai", emoji: "🏔️" },
  { slug: "phuket", label: "Phuket", emoji: "🏝️" },
  { slug: "pattaya", label: "Pattaya", emoji: "🏖️" },
  { slug: "hua-hin", label: "Hua Hin", emoji: "🌅" },
  { slug: "koh-samui", label: "Koh Samui", emoji: "🌴" },
];

export default function LandingPage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const bundle = loadPlaces();
  const topPerNiche = getTopPlacesPerNiche(4);

  // Hero photo: walk a curated niche preference (aspirational first), grabbing
  // the highest-trust place that has a photo. spa/diving/coworking have ZERO
  // photos in current data (see by_niche photo counts), so they fall through.
  const HERO_NICHE_PREFERENCE: Niche[] = [
    "wellness",
    "yoga-pilates",
    "cooking",
    "spa",
    "diving",
    "muay-thai",
    "coworking",
  ];
  let heroPlace: Place | undefined;
  for (const n of HERO_NICHE_PREFERENCE) {
    const candidate = getPlacesByNiche(n)
      .filter((p) => p.top_photo_url)
      .sort((a, b) => b.trust_score - a.trust_score)[0];
    if (candidate) { heroPlace = candidate; break; }
  }

  // Editor's picks: top trust-score places overall (with photos)
  const editorsPicks = getTopPlaces(200)
    .filter((p) => p.top_photo_url && p.review_count && p.review_count >= 20)
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, 8);

  // Trending in Bangkok: top places in Bangkok across all niches
  const bangkokPicks = getTopPlaces(2147)
    .filter((p) => p.city?.toLowerCase() === "bangkok" && p.top_photo_url)
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, 6);

  return (
    <main className="pb-20">
      {/* HERO — full-bleed photo with overlay */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          {heroPlace?.top_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroPlace.top_photo_url}
              alt="Thailand"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-emerald-200 to-amber-200" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/85" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:py-28">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm ring-1 ring-white/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            {bundle.total.toLocaleString()} verified places · 6 sources · No paid promotion
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
            {t("hero_title", lang)}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
            {t("hero_subtitle", lang)}
          </p>
          <p className="mt-3 text-sm font-medium text-white/85">
            {t("for_audience", lang)}
          </p>

          {/* Quick paths */}
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { label: "Bangkok spa", href: `/${lang}/c/spa/?city=bangkok` },
              { label: "Phuket diving", href: `/${lang}/c/diving/?city=phuket` },
              { label: "Chiang Mai yoga", href: `/${lang}/c/yoga-pilates/?city=chiang-mai` },
              { label: "Muay thai camps", href: `/${lang}/c/muay-thai/` },
              { label: "Cooking class", href: `/${lang}/c/cooking/?city=bangkok` },
              { label: "Wellness retreats", href: `/${lang}/c/wellness/` },
            ].map((p) => (
              <Link
                key={p.label}
                href={p.href}
                className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm ring-1 ring-white/40 transition hover:bg-white/25"
              >
                {p.label} →
              </Link>
            ))}
          </div>
        </div>

        {/* Hero photo credit — bottom right */}
        {heroPlace && (
          <div className="absolute bottom-3 right-3 rounded-md bg-black/40 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm">
            📷 {heroPlace.name} · {heroPlace.city}
          </div>
        )}
      </section>

      {/* STATS BANNER */}
      <section className="bg-white py-6 dark:bg-ink-950">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-4 text-center sm:grid-cols-4">
          <BannerStat value={bundle.total.toLocaleString()} label="Verified places" />
          <BannerStat value="6" label="Languages" />
          <BannerStat value="6" label="Trust sources" />
          <BannerStat value="$0" label="Listing fee" />
        </div>
      </section>

      {/* NICHE TILES — full-photo, distinctive */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("browse_categories", lang)}
            </h2>
            <p className="mt-1 text-sm muted">7 niches · curated, multilingual, verified</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NICHES.map((n) => {
            const meta = NICHE_META[n];
            const count = (bundle.by_niche as Record<string, number>)[n] ?? 0;
            const isReady = count > 0;
            const topThree = topPerNiche[n] ?? [];
            const heroPhoto = topThree.find((p) => p.top_photo_url)?.top_photo_url;
            return (
              <Link
                key={n}
                href={`/${lang}/c/${n}/`}
                className={`group relative block aspect-[5/4] overflow-hidden rounded-2xl transition ${
                  isReady ? "hover:-translate-y-0.5 hover:shadow-2xl" : "opacity-70"
                }`}
              >
                {heroPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroPhoto}
                    alt={nicheName(n, lang)}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0">
                    <PlacePlaceholder niche={n} size="lg" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Count chip */}
                <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black tabular-nums shadow-md dark:bg-ink-900/95">
                  {count.toLocaleString()}
                </div>

                {/* Content overlay */}
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="text-2xl">{meta.emoji}</div>
                  <h3 className="mt-1 text-2xl font-black tracking-tight">{nicheName(n, lang)}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-white/85">{nicheTagline(n, lang)}</p>
                  {topThree.length > 0 && (
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-white/75">
                      <span>★</span>
                      <span className="truncate">{topThree[0].name}</span>
                      {topThree[1] && <span className="ml-1">+ {topThree.length - 1} more</span>}
                    </div>
                  )}
                  {!isReady && (
                    <div className="mt-2 text-[10px] uppercase tracking-wide text-white/70">
                      {t("coming_soon", lang)}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* EDITOR'S PICKS — top-trust places overall */}
      {editorsPicks.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">⭐ Editor&apos;s picks</h2>
              <p className="mt-1 text-sm muted">Highest cross-source trust scores</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {editorsPicks.map((p) => (
              <PlaceCardMini key={p.id} place={p} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* TRENDING IN BANGKOK */}
      {bangkokPicks.length > 0 && (
        <section className="bg-emerald-50/40 py-12 dark:bg-emerald-950/20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">🏙️ Trending in Bangkok</h2>
                <p className="mt-1 text-sm muted">Top-rated across all categories</p>
              </div>
              <Link
                href={`/${lang}/`}
                className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
              >
                Browse all cities →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {bangkokPicks.map((p) => (
                <PlaceCardMini key={p.id} place={p} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CITY QUICK PICKS */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Browse by city</h2>
          <p className="mt-1 text-sm muted">Tap a city to see all verified places</p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {FEATURED_CITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/${lang}/c/spa/?city=${c.slug}`}
              className="group rounded-xl border border-ink-100 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow dark:border-ink-800 dark:bg-ink-900"
            >
              <div className="text-3xl">{c.emoji}</div>
              <div className="mt-1 text-sm font-bold">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* WHY US vs KLOOK / TRIPADVISOR — clear differentiation */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Why book through Verified Thai?</h2>
          <p className="mt-2 text-sm muted">Direct contact with the business. No 15% Klook markup. Honest scoring.</p>
        </div>
        <div className="mt-8 overflow-x-auto">
          <table className="mx-auto min-w-[640px] text-sm">
            <thead>
              <tr className="border-b-2 border-ink-200 dark:border-ink-700">
                <th className="px-4 py-3 text-left font-semibold"></th>
                <th className="px-4 py-3 text-left font-black text-emerald-700 dark:text-emerald-400">
                  ✅ Verified Thai
                </th>
                <th className="px-4 py-3 text-left font-medium muted">Klook / Viator</th>
                <th className="px-4 py-3 text-left font-medium muted">Google Maps</th>
              </tr>
            </thead>
            <tbody>
              <CompareRow
                label="Direct contact"
                us="Inquiry → business directly"
                others={["Through platform", "Phone only"]}
              />
              <CompareRow
                label="Booking commission"
                us="0% — no markup"
                others={["10–15% added", "0%"]}
              />
              <CompareRow
                label="Ranking algorithm"
                us="Trust Score from 6 sources"
                others={["Paid placements", "Maps algorithm"]}
              />
              <CompareRow
                label="Korean / Thai reviews"
                us="Surfaced per place"
                others={["English only", "Google reviews only"]}
              />
              <CompareRow
                label="Multilingual SEO"
                us="6 languages, native pages"
                others={["English primary", "Auto-translate"]}
              />
              <CompareRow
                label="Verification independence"
                us="No paid promotion"
                others={["Pay-to-rank", "Owner-controlled"]}
              />
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-center text-xs muted">
          We aggregate the same Klook/Viator URLs so you can compare —{" "}
          <span className="font-semibold">but the customer-business connection is yours, not the platform&apos;s.</span>
        </p>
      </section>

      {/* HOW WE VERIFY — trust trust trust */}
      <section className="bg-ink-50 py-14 dark:bg-ink-900/40">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How we verify</h2>
            <p className="mt-2 text-sm muted">Every place is cross-checked across 6 independent sources</p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TrustCard
              icon="🔍"
              title="6 sources cross-checked"
              body="Google reviews, YouTube, Naver (KR), Pantip (TH), Bookimed, official websites."
            />
            <TrustCard
              icon="🚫"
              title="No paid placement"
              body="Trust scores reflect actual sentiment, not who paid. We never accept money to rank a business."
            />
            <TrustCard
              icon="🌍"
              title="6 languages"
              body="English, 한국어, ภาษาไทย, 中文, 日本語, العربية. Real Korean & Thai posts surface for tourists."
            />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs muted">
            {["Google", "YouTube", "Reddit", "Naver", "Pantip", "Bookimed"].map((s) => (
              <span
                key={s}
                className="rounded-full border border-ink-200 bg-white px-3 py-1 font-medium dark:border-ink-700 dark:bg-ink-900"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FOR BUSINESS CTA */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-amber-50 p-8 sm:p-12 dark:border-emerald-800 dark:from-emerald-950/40 dark:to-amber-950/30">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Own a business in Thailand?</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed muted">
                Claim your listing, manage hours and photos, and reach Korean / Chinese / Japanese / English tourists with multilingual SEO pages — free for the first 10 inquiries each month.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl"
            >
              Claim your listing →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function CompareRow({
  label,
  us,
  others,
}: {
  label: string;
  us: string;
  others: [string, string];
}) {
  return (
    <tr className="border-b border-ink-100 dark:border-ink-800">
      <td className="px-4 py-3 font-semibold">{label}</td>
      <td className="px-4 py-3 text-emerald-800 dark:text-emerald-300">
        <span className="font-bold">{us}</span>
      </td>
      <td className="px-4 py-3 muted">{others[0]}</td>
      <td className="px-4 py-3 muted">{others[1]}</td>
    </tr>
  );
}

function BannerStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-black tabular-nums sm:text-3xl">{value}</div>
      <div className="text-[11px] uppercase tracking-wide muted">{label}</div>
    </div>
  );
}

function TrustCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed muted">{body}</p>
    </div>
  );
}

function PlaceCardMini({ place, lang }: { place: Place; lang: Lang }) {
  const meta = NICHE_META[place.niche];
  return (
    <Link
      href={`/${lang}/place/${place.slug}/`}
      className="group block overflow-hidden rounded-xl border border-ink-100 bg-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900"
    >
      <div className="relative aspect-square overflow-hidden bg-ink-50 dark:bg-ink-800">
        {place.top_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.top_photo_url}
            alt={place.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <PlacePlaceholder niche={place.niche} size="md" />
        )}
        <div className="absolute right-1.5 top-1.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow">
          {place.trust_score}
        </div>
      </div>
      <div className="p-2.5">
        <div className="line-clamp-2 text-xs font-bold leading-tight">{place.name}</div>
        <div className="mt-1 flex items-center justify-between text-[10px] muted">
          <span className="truncate">{place.city}</span>
          {place.rating != null && (
            <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400">
              ★ {place.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
