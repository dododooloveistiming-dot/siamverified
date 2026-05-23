import type { Metadata } from "next";
import Link from "next/link";
import { loadPlaces, getTopPlacesPerNiche } from "@/lib/data";
import { SITE, SUPPORTED_LANGS, T, t } from "@/lib/i18n";
import type { Lang, Niche } from "@/lib/types";
import { NICHE_META } from "@/lib/types";
import Header from "@/components/Header";

export const dynamic = "force-static";
export function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }));
}

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

  const noFouc = `(function(){try{var s=localStorage.getItem('theme');var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

  const niches: Niche[] = ["muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking"];

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: noFouc }} />
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <Header lang={lang} />

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
                  <span>{NICHE_META[n][lang === "ko" ? "ko" : lang === "th" ? "th" : "en"] ?? NICHE_META[n].en}</span>
                  <span className="text-xs muted">({(bundle.by_niche as any)[n] ?? 0})</span>
                </Link>
              ))}
            </div>
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
              return (
                <Link
                  key={n}
                  href={isReady ? `/${lang}/c/${n}` : `/${lang}/c/${n}`}
                  className={`group relative flex flex-col gap-3 rounded-2xl border bg-white p-5 transition dark:bg-ink-900 ${
                    isReady
                      ? "border-ink-100 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg dark:border-ink-800"
                      : "border-dashed border-ink-200 opacity-70 dark:border-ink-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-3xl">{meta.emoji}</div>
                      <h3 className="mt-2 text-lg font-bold">
                        {meta[lang === "ko" ? "ko" : lang === "th" ? "th" : "en"] ?? meta.en}
                      </h3>
                      <p className="mt-1 text-sm muted">{meta.tagline_en}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black tabular-nums">{count.toLocaleString()}</div>
                      <div className="text-[10px] muted uppercase">{isReady ? t("places_count", lang) : "coming soon"}</div>
                    </div>
                  </div>
                  {topThree.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-ink-100 pt-2 text-xs dark:border-ink-800">
                      <div className="muted">Top picks:</div>
                      {topThree.map((p) => (
                        <div key={p.id} className="flex items-center justify-between">
                          <span className="truncate">{p.name}</span>
                          <span className="ml-2 shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {p.trust_score}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* MULTI-SOURCE PITCH */}
        <section className="mt-16 rounded-2xl border border-ink-100 bg-white p-8 dark:border-ink-800 dark:bg-ink-900">
          <h2 className="text-xl font-bold">How we score every place</h2>
          <p className="mt-2 text-sm muted">
            Every Trust Score combines independent signals. No place can buy a higher rank — the formula is public.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { name: "Google", count: bundle.places.filter((p) => p.source_badges.google_reviews > 0).length, badge: "★" },
              { name: "Reddit", count: bundle.places.filter((p) => p.source_badges.reddit > 0).length, badge: "💬" },
              { name: "YouTube", count: bundle.places.filter((p) => p.source_badges.videos > 0).length, badge: "▶" },
              { name: "Naver", count: bundle.places.filter((p) => p.source_badges.naver > 0).length, badge: "🇰🇷" },
              { name: "Pantip", count: bundle.places.filter((p) => p.source_badges.pantip > 0).length, badge: "🇹🇭" },
              { name: "Bookimed", count: bundle.places.filter((p) => p.source_badges.bookimed > 0).length, badge: "🏥" },
              { name: "Photos", count: bundle.places.filter((p) => p.source_badges.photos > 0).length, badge: "📸" },
              { name: "Official sites", count: bundle.places.filter((p) => p.source_badges.website > 0).length, badge: "🔗" },
            ].map((s) => (
              <div key={s.name} className="rounded-xl bg-emerald-50/60 p-3 text-sm dark:bg-emerald-950/30">
                <div className="text-xl">{s.badge}</div>
                <div className="mt-1 font-bold">{s.name}</div>
                <div className="text-xs muted">{s.count.toLocaleString()} places</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-16 border-t border-ink-100 pt-6 text-xs muted dark:border-ink-800">
          <p className="max-w-3xl">{t("footer_blurb", lang)}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div>© {new Date().getFullYear()} {SITE.name}</div>
            <div>Sources: Google · Reddit · Naver · Pantip · YouTube · Bookimed · Official sites</div>
          </div>
        </footer>
      </div>
    </>
  );
}
