import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlaces, getPlacesByNiche, loadCommunity } from "@/lib/data";
import { SITE, SUPPORTED_LANGS, T, t } from "@/lib/i18n";
import type { Lang, Niche } from "@/lib/types";
import { NICHE_META, nicheName, nicheTagline } from "@/lib/types";
import CategoryClient from "@/components/CategoryClient";

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
  const url = `${SITE.origin}/${lang}/c/${niche}/`;
  const title = `${nicheName(niche, lang)} — ${SITE.name}`;
  const description = `${nicheTagline(niche, lang)} · ${t("sources_pitch", lang)}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/c/${niche}/`])),
    },
    openGraph: {
      title,
      description,
      url,
    },
  };
}

export default function CategoryPage({ params }: { params: { lang: Lang; niche: Niche } }) {
  const { lang, niche } = params;
  if (!NICHES.includes(niche)) notFound();

  const places = getPlacesByNiche(niche);
  const community = loadCommunity(niche);
  const meta = NICHE_META[niche];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20">
      <nav className="mt-6 text-xs muted">
        <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
        <span className="mx-2">/</span>
        <span>{nicheName(niche, lang)}</span>
      </nav>

      <header className="mt-2 border-b border-ink-100 pb-6 dark:border-ink-800">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl">{meta.emoji}</span>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{nicheName(niche, lang)}</h1>
        </div>
        <p className="mt-2 text-sm muted">{nicheTagline(niche, lang)}</p>
        <div className="mt-3 text-xs muted">
          {places.length.toLocaleString()} {t("places_count", lang)} · {t("sources_pitch", lang)}
        </div>
      </header>

      {places.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
          <p className="text-lg font-bold">{t("coming_soon", lang)}</p>
          <p className="mt-2 text-sm muted">{t("coming_soon_msg", lang)}</p>
        </div>
      ) : (
        <CategoryClient places={places} lang={lang} niche={niche} />
      )}

        {/* COMMUNITY DISCUSSIONS — niche-level Reddit + Pantip + Naver */}
        {community && (community.top_reddit.length + community.top_pantip.length + community.top_naver.length > 0) && (
          <section className="mt-16">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-2xl font-bold tracking-tight">{t("community_discussions", lang)}</h2>
              <span className="text-xs muted">
                {(community.counts.reddit + community.counts.pantip + community.counts.naver).toLocaleString()} {t("threads_scanned", lang)}
              </span>
            </div>
            <p className="mb-6 max-w-2xl text-sm muted">{t("community_blurb", lang)}</p>

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
          <Link href={`/${lang}/`} className="hover:underline">← {t("back_to_all", lang)}</Link>
        </div>
      </footer>
    </main>
  );
}
