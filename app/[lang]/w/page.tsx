import type { Metadata } from "next";
import Link from "next/link";
import { SITE, SUPPORTED_LANGS, t, tf, withXDefault } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { collectionName, getCollectionPlaces, liveCollections } from "@/lib/collections";
import { genericOgImage } from "@/lib/og";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-static";

export function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: { lang: Lang } }): Promise<Metadata> {
  const { lang } = params;
  const url = `${SITE.origin}/${lang}/w/`;
  const title = `${t("coll_hub_h1", lang)} — ${SITE.name}`;
  const description = t("coll_hub_sub", lang);
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: withXDefault(Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/w/`]),
      )),
    },
    openGraph: { title, description, url, images: genericOgImage(title, description, "🧖") },
  };
}

export default function CollectionsHub({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const collections = liveCollections();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("coll_hub_h1", lang)}</h1>
      <p className="mt-3 max-w-2xl text-base muted">{t("coll_hub_sub", lang)}</p>

      <Link
        href={`/${lang}/verify/`}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
      >
        🔎 {t("coll_verify_cta", lang)}
      </Link>

      <ul className="mt-9 grid gap-3 sm:grid-cols-2">
        {collections.map((c) => {
          const count = getCollectionPlaces(c).length;
          return (
            <li key={c.slug}>
              <Link
                href={`/${lang}/w/${c.slug}/`}
                className="flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-5 transition hover:border-clinic dark:border-ink-700 dark:bg-ink-800"
              >
                <span className="text-3xl" aria-hidden>{c.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{collectionName(c, lang)}</span>
                  <span className="block text-sm muted">{tf("coll_count", lang, { count })}</span>
                </span>
                <span className="text-clinic" aria-hidden>→</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-10">
        <AdSlot slot="collections-hub" />
      </div>
    </main>
  );
}
