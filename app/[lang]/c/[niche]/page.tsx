import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlaces, getPlacesByNiche, loadCommunity } from "@/lib/data";
import { SITE, SUPPORTED_LANGS, T, t } from "@/lib/i18n";
import type { Lang, Niche } from "@/lib/types";
import { NICHE_META } from "@/lib/types";
import Header from "@/components/Header";

const NICHES: Niche[] = ["muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking"];

export const dynamic = "force-static";

export function generateStaticParams() {
  const params: Array<{ lang: Lang; niche: Niche }> = [];
  for (const lang of SUPPORTED_LANGS) {
    for (const niche of NICHES) {
      params.push({ lang, niche });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: { lang: Lang; niche: Niche } }): Promise<Metadata> {
  const { lang, niche } = params;
  if (!NICHES.includes(niche)) return {};
  const meta = NICHE_META[niche];
  const url = `${SITE.origin}/${lang}/c/${niche}/`;
  const title = `${meta.en} in Thailand — ${SITE.name}`;
  return {
    title,
    description: `${meta.tagline_en}. Verified by 6 independent sources. No paid promotion.`,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/c/${niche}/`])),
    },
    openGraph: {
      title,
      description: meta.tagline_en,
      url,
    },
  };
}

const PRICE_BAND_LABEL: Record<string, { en: string; emoji: string }> = {
  budget: { en: "Budget", emoji: "💵" },
  mid: { en: "Mid", emoji: "💵💵" },
  premium: { en: "Premium", emoji: "💵💵💵" },
  luxury: { en: "Luxury", emoji: "💎" },
  unknown: { en: "—", emoji: "" },
};

export default function CategoryPage({ params }: { params: { lang: Lang; niche: Niche } }) {
  const { lang, niche } = params;
  if (!NICHES.includes(niche)) notFound();

  const places = getPlacesByNiche(niche);
  const community = loadCommunity(niche);
  const meta = NICHE_META[niche];
  const noFouc = `(function(){try{var s=localStorage.getItem('theme');var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: noFouc }} />
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <Header lang={lang} />

        <nav className="mt-6 text-xs muted">
          <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
          <span className="mx-2">/</span>
          <span>{meta.en}</span>
        </nav>

        <header className="mt-2 border-b border-ink-100 pb-6 dark:border-ink-800">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl">{meta.emoji}</span>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              {meta[lang === "ko" ? "ko" : lang === "th" ? "th" : "en"] ?? meta.en}
            </h1>
          </div>
          <p className="mt-2 text-sm muted">{meta.tagline_en}</p>
          <div className="mt-3 text-xs muted">
            {places.length.toLocaleString()} {t("places_count", lang)} · {t("sources_pitch", lang)}
          </div>
        </header>

        {places.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
            <p className="text-lg font-bold">Coming soon</p>
            <p className="mt-2 text-sm muted">
              This category is currently being verified across our 6 sources. Check back soon.
            </p>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p) => {
              const pb = PRICE_BAND_LABEL[p.price_band] ?? PRICE_BAND_LABEL.unknown;
              return (
                <li key={p.id}>
                  <Link
                    href={`/${lang}/place/${p.slug}`}
                    className="group flex h-full flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900"
                  >
                    {p.top_photo_url ? (
                      <div className="aspect-video overflow-hidden rounded-xl bg-ink-50 dark:bg-ink-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.top_photo_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-amber-50 text-4xl dark:from-emerald-950/40 dark:to-amber-950/30">
                        {meta.emoji}
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-base font-bold leading-tight">{p.name}</h3>
                      <div className="shrink-0 text-right">
                        <div className="rounded bg-emerald-100 px-2 py-0.5 text-sm font-black tabular-nums text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {p.trust_score}
                        </div>
                        <div className="mt-0.5 text-[10px] muted">Trust</div>
                      </div>
                    </div>
                    <div className="text-xs muted">
                      {p.city ? `${p.city} · ` : ""}
                      {p.rating ? `★ ${p.rating.toFixed(1)}` : "—"}
                      {p.review_count ? ` (${p.review_count.toLocaleString()})` : ""}
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-1.5 text-[10px]">
                      {p.is_beginner_friendly && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                          {t("filter_beginner", lang)}
                        </span>
                      )}
                      {p.languages.ko && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                          🇰🇷 KO
                        </span>
                      )}
                      {p.is_open_24h && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          24h
                        </span>
                      )}
                      {p.price_band !== "unknown" && (
                        <span className="rounded-full bg-ink-100 px-2 py-0.5 font-medium dark:bg-ink-800">
                          {pb.emoji} {pb.en}
                        </span>
                      )}
                      {p.is_suspected_viral && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                          ⚠ low signal
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* COMMUNITY DISCUSSIONS — niche-level Reddit + Pantip + Naver */}
        {community && (community.top_reddit.length + community.top_pantip.length + community.top_naver.length > 0) && (
          <section className="mt-16">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Community discussions</h2>
              <span className="text-xs muted">
                {(community.counts.reddit + community.counts.pantip + community.counts.naver).toLocaleString()} threads scanned
              </span>
            </div>
            <p className="mb-6 max-w-2xl text-sm muted">
              Unfiltered conversations from Reddit, Pantip (TH), and Naver (KR) — independent perspectives that complement Google reviews.
            </p>

            {community.top_reddit.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-3 inline-flex items-center gap-2 text-base font-bold">
                  <span>💬</span> Reddit <span className="text-xs font-normal muted">({community.counts.reddit.toLocaleString()} threads)</span>
                </h3>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {community.top_reddit.slice(0, 8).map((t, i) => (
                    <li key={`r-${i}`}>
                      <a href={t.url} target="_blank" rel="nofollow noopener" className="block rounded-xl border border-ink-100 bg-white p-3 transition hover:border-orange-400 hover:shadow dark:border-ink-800 dark:bg-ink-900">
                        <div className="text-xs muted">
                          r/{t.subreddit || "all"} {t.score ? `· ${t.score}↑` : ""} {t.comments ? `· ${t.comments} comments` : ""}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{t.title}</div>
                        {t.snippet && <div className="mt-1 line-clamp-2 text-xs muted">{t.snippet}</div>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {community.top_pantip.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-3 inline-flex items-center gap-2 text-base font-bold">
                  <span>🇹🇭</span> Pantip <span className="text-xs font-normal muted">({community.counts.pantip.toLocaleString()} threads)</span>
                </h3>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {community.top_pantip.slice(0, 6).map((t, i) => (
                    <li key={`p-${i}`}>
                      <a href={t.url} target="_blank" rel="nofollow noopener" className="block rounded-xl border border-ink-100 bg-white p-3 transition hover:border-fuchsia-400 hover:shadow dark:border-ink-800 dark:bg-ink-900">
                        <div className="text-xs muted">
                          Pantip {t.score ? `· ${t.score}♥` : ""} {t.comments ? `· ${t.comments} replies` : ""}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{t.title}</div>
                        {t.snippet && <div className="mt-1 line-clamp-2 text-xs muted">{t.snippet}</div>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {community.top_naver.length > 0 && (
              <div>
                <h3 className="mb-3 inline-flex items-center gap-2 text-base font-bold">
                  <span>🇰🇷</span> Naver Blog <span className="text-xs font-normal muted">({community.counts.naver.toLocaleString()} posts)</span>
                </h3>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {community.top_naver.slice(0, 6).map((t, i) => (
                    <li key={`n-${i}`}>
                      <a href={t.url} target="_blank" rel="nofollow noopener" className="block rounded-xl border border-ink-100 bg-white p-3 transition hover:border-emerald-400 hover:shadow dark:border-ink-800 dark:bg-ink-900">
                        <div className="text-xs muted">
                          Naver {t.author ? `· ${t.author}` : ""} {t.date ? `· ${t.date}` : ""}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{t.title}</div>
                        {t.snippet && <div className="mt-1 line-clamp-2 text-xs muted">{t.snippet}</div>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <footer className="mt-16 border-t border-ink-100 pt-6 text-xs muted dark:border-ink-800">
          <p className="max-w-3xl">{t("footer_blurb", lang)}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div>© {new Date().getFullYear()} {SITE.name}</div>
            <Link href={`/${lang}/`} className="hover:underline">← All categories</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
