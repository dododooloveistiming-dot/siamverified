import type { Metadata } from "next";
import Link from "next/link";
import { loadPlaces, getTopPlacesPerNiche } from "@/lib/data";
import { SITE, SUPPORTED_LANGS, T, t } from "@/lib/i18n";
import type { Lang, Niche } from "@/lib/types";
import { NICHE_META, nicheName, nicheTagline } from "@/lib/types";

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

export default function LandingPage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const bundle = loadPlaces();
  const topPerNiche = getTopPlacesPerNiche(3);

  const niches: Niche[] = [
    "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20">
      {/* HERO */}
        <section className="relative mt-6 overflow-hidden rounded-3xl border border-ink-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-6 py-16 dark:border-ink-800 dark:from-emerald-950/40 dark:via-ink-900 dark:to-amber-950/30 sm:px-12">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-700/20" />
          <div className="absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-700/20" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {bundle.total.toLocaleString()} verified places · avg Trust Score {bundle.avg_trust}
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              {t("hero_title", lang)}
            </h1>
            <p className="mt-4 max-w-2xl text-lg muted">
              {t("hero_subtitle", lang)}
            </p>
            <p className="mt-2 text-sm font-medium text-ink-700 dark:text-ink-300">
              {t("for_audience", lang)}
            </p>
            <p className="mt-3 text-xs muted">
              {t("sources_pitch", lang)}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {niches.map((n) => (
                <Link
                  key={n}
                  href={`/${lang}/c/${n}`}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/80 px-4 py-2 text-sm font-medium backdrop-blur transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-ink-700 dark:bg-ink-900/80 dark:hover:bg-emerald-900/30"
                >
                  <span>{NICHE_META[n].emoji}</span>
                  <span>{nicheName(n, lang)}</span>
                  <span className="text-xs muted">({(bundle.by_niche as any)[n] ?? 0})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* POPULAR PICKS — quick deep-link strip */}
        <section className="mt-8">
          <div className="text-xs uppercase tracking-wide font-bold muted mb-3">
            {t("popular_picks", lang)}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Bangkok spa", href: `/${lang}/c/spa/?city=bangkok` },
              { label: "Phuket diving", href: `/${lang}/c/diving/?city=phuket` },
              { label: "Chiang Mai yoga", href: `/${lang}/c/yoga-pilates/?city=chiang-mai` },
              { label: "Phuket muay thai", href: `/${lang}/c/muay-thai/?city=phuket` },
              { label: "Bangkok cooking class", href: `/${lang}/c/cooking/?city=bangkok` },
              { label: "Chiang Mai coworking", href: `/${lang}/c/coworking/?city=chiang-mai` },
              { label: "Wellness retreat", href: `/${lang}/c/wellness/` },
            ].map((p) => (
              <Link
                key={p.label}
                href={p.href}
                className="rounded-full bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-emerald-100 hover:text-emerald-800 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300"
              >
                {p.label} →
              </Link>
            ))}
          </div>
        </section>

        {/* CATEGORY GRID */}
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">{t("browse_categories", lang)}</h2>
            <span className="text-xs muted">{bundle.total.toLocaleString()} {t("places_count", lang)}</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {niches.map((n) => {
              const meta = NICHE_META[n];
              const count = (bundle.by_niche as any)[n] ?? 0;
              const isReady = count > 0;
              const topThree = topPerNiche[n] ?? [];
              const heroPhoto = topThree.find((p) => p.top_photo_url)?.top_photo_url;
              return (
                <Link
                  key={n}
                  href={`/${lang}/c/${n}/`}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition dark:bg-ink-900 ${
                    isReady
                      ? "border-ink-100 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg dark:border-ink-800"
                      : "border-dashed border-ink-200 opacity-70 dark:border-ink-700"
                  }`}
                >
                  {/* Hero photo backdrop with niche emoji overlay */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950/30 dark:to-amber-950/20">
                    {heroPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={heroPhoto}
                        alt={nicheName(n, lang)}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-6xl">{meta.emoji}</div>
                    )}
                    {/* Gradient overlay for legibility */}
                    {heroPhoto && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    )}
                    <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl shadow-md dark:bg-ink-900/90">
                      {meta.emoji}
                    </div>
                    <div className="absolute right-3 top-3 rounded-md bg-white/95 px-2 py-0.5 text-xs font-black tabular-nums shadow-md dark:bg-ink-900/90">
                      {count.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="text-lg font-bold leading-tight">{nicheName(n, lang)}</h3>
                    <p className="text-sm muted line-clamp-2">{nicheTagline(n, lang)}</p>
                    {topThree.length > 0 && (
                      <div className="mt-auto space-y-1 border-t border-ink-100 pt-2 text-xs dark:border-ink-800">
                        <div className="muted text-[10px] uppercase tracking-wide">{t("top_picks", lang)}</div>
                        {topThree.slice(0, 3).map((p) => (
                          <div key={p.id} className="flex items-center justify-between">
                            <span className="truncate">{p.name}</span>
                            <span className="ml-2 shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                              {p.trust_score}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isReady && (
                      <div className="mt-auto text-[10px] muted uppercase tracking-wide">
                        {t("coming_soon", lang)}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* MULTI-SOURCE PITCH */}
        <section className="mt-16 rounded-2xl border border-ink-100 bg-white p-8 dark:border-ink-800 dark:bg-ink-900">
          <h2 className="text-xl font-bold">{t("score_pitch_title", lang)}</h2>
          <p className="mt-2 text-sm muted">{t("score_pitch_blurb", lang)}</p>
          {(() => {
            const cards = [
              { name: "Google", count: bundle.places.filter((p) => p.source_badges.google_reviews > 0).length, badge: "★" },
              { name: "Reddit", count: bundle.places.filter((p) => p.source_badges.reddit > 0).length, badge: "💬" },
              { name: "YouTube", count: bundle.places.filter((p) => p.source_badges.videos > 0).length, badge: "▶" },
              { name: "Naver", count: bundle.places.filter((p) => p.source_badges.naver > 0).length, badge: "🇰🇷" },
              { name: "Pantip", count: bundle.places.filter((p) => p.source_badges.pantip > 0).length, badge: "🇹🇭" },
              { name: "Bookimed", count: bundle.places.filter((p) => p.source_badges.bookimed > 0).length, badge: "🏥" },
              { name: "Photos", count: bundle.places.filter((p) => p.source_badges.photos > 0).length, badge: "📸" },
              { name: "Official sites", count: bundle.places.filter((p) => p.source_badges.website > 0).length, badge: "🔗" },
            ].filter((s) => s.count > 0);
            return (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {cards.map((s) => (
                  <div key={s.name} className="rounded-xl bg-emerald-50/60 p-3 text-sm dark:bg-emerald-950/30">
                    <div className="text-xl">{s.badge}</div>
                    <div className="mt-1 font-bold">{s.name}</div>
                    <div className="text-xs muted">{s.count.toLocaleString()} places</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>

    </main>
  );
}
