import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toPlaceCard } from "@/lib/data";
import {
  SITE, SUPPORTED_LANGS, TRUST_SOURCES, t, tf, withXDefault, resolveCategoryStrings,
} from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import {
  collectionName, getCollection, getCollectionPlaces,
  hasEnoughCollectionPlaces, liveCollections,
} from "@/lib/collections";
import CategoryClient from "@/components/CategoryClient";
import { cityFacets, initialCards } from "@/lib/cards";
import AdSlot from "@/components/AdSlot";
import { genericOgImage } from "@/lib/og";

// See lib/collections.ts for why these exist as a keyword view rather than
// new `Niche` members.
export const dynamic = "force-static";

// Only collections that clear MIN_COLLECTION_PLACES are built. `dynamicParams`
// is off so a thin one (ice-bath, at 3 venues today) 404s instead of rendering
// an empty page — it starts building on its own once the venues are scraped.
export const dynamicParams = false;

export function generateStaticParams() {
  const params: Array<{ lang: Lang; collection: string }> = [];
  for (const lang of SUPPORTED_LANGS) {
    for (const c of liveCollections()) {
      params.push({ lang, collection: c.slug });
    }
  }
  return params;
}

export async function generateMetadata(
  { params }: { params: { lang: Lang; collection: string } },
): Promise<Metadata> {
  const { lang } = params;
  const c = getCollection(params.collection);
  if (!c || !hasEnoughCollectionPlaces(c)) return {};
  const name = collectionName(c, lang);
  const count = getCollectionPlaces(c).length;
  const url = `${SITE.origin}/${lang}/w/${c.slug}/`;
  const title = tf("coll_meta_title", lang, { name, count });
  const description = tf("coll_meta_desc", lang, { name, count });
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: withXDefault(Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/w/${c.slug}/`]),
      )),
    },
    openGraph: { title, description, url, images: genericOgImage(title, description, c.emoji) },
  };
}

export default function CollectionPage({ params }: { params: { lang: Lang; collection: string } }) {
  const { lang } = params;
  const c = getCollection(params.collection);
  if (!c || !hasEnoughCollectionPlaces(c)) notFound();

  const name = collectionName(c, lang);
  const places = getCollectionPlaces(c);
  const count = places.length;
  // Slim projection — CategoryClient is a client component and the full
  // Place[] (reviews_sample/photos_sample) would bloat the RSC payload.
  // Only the first page is handed over; the rest comes from
  // /api/cards/w/[collection]/ on demand. See lib/cards.ts.
  const cards = places.map(toPlaceCard);
  const others = liveCollections().filter((x) => x.slug !== c.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: tf("coll_meta_title", lang, { name, count }),
    description: tf("coll_meta_desc", lang, { name, count }),
    url: `${SITE.origin}/${lang}/w/${c.slug}/`,
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.origin },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: count,
      itemListElement: places.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE.origin}/${lang}/place/${p.slug}/`,
        name: p.name,
      })),
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-xs muted">
        <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
        {" / "}
        <Link href={`/${lang}/w/`} className="hover:underline">{t("coll_all_collections", lang)}</Link>
      </nav>

      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
        <span aria-hidden>{c.emoji}</span> {tf("coll_h1", lang, { name })}
      </h1>
      <p className="mt-3 max-w-2xl text-base muted">
        {tf("coll_sub", lang, { count: count.toLocaleString(), sources: TRUST_SOURCES.length })}
      </p>

      <Link
        href={`/${lang}/verify/`}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
      >
        🔎 {t("coll_verify_cta", lang)}
      </Link>

      <div className="mt-8">
        <CategoryClient
          initial={initialCards(cards)}
          total={cards.length}
          cityFacets={cityFacets(cards)}
          cardsUrl={`/api/cards/w/${c.slug}/`}
          lang={lang}
          niche={c.niches[0]}
          strings={resolveCategoryStrings(lang)}
        />
      </div>

      <section className="mt-14 border-t border-ink-200 pt-8 dark:border-ink-700">
        <h2 className="text-sm font-bold uppercase tracking-wide muted">
          {t("coll_all_collections", lang)}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {others.map((o) => (
            <li key={o.slug}>
              <Link
                href={`/${lang}/w/${o.slug}/`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-3 py-1.5 text-sm font-semibold transition hover:border-clinic dark:border-ink-700"
              >
                <span aria-hidden>{o.emoji}</span>
                {collectionName(o, lang)}
                <span className="muted">
                  {tf("coll_count", lang, { count: getCollectionPlaces(o).length })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <AdSlot slot="collection-footer" />
      </div>
    </main>
  );
}

