import type { Metadata } from "next";
import Link from "next/link";
import { loadPlaces } from "@/lib/data";
import {
  SITE, SUPPORTED_LANGS, TRUST_SOURCES, t, tf, withXDefault, resolveVerifyStrings,
} from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { genericOgImage } from "@/lib/og";
import VerifyBox from "@/components/VerifyBox";
import AdSlot from "@/components/AdSlot";

// The entry point for the traffic this site is actually built for: someone
// sees a sauna / ice bath / pilates studio / dive shop on Instagram or TikTok
// and wants to know whether it's real before they book. The whole lookup runs
// in the browser against public/data/handles.json, so this page is fully
// static and costs nothing per check.
export const dynamic = "force-static";

export function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: { lang: Lang } }): Promise<Metadata> {
  const { lang } = params;
  const url = `${SITE.origin}/${lang}/verify/`;
  const title = t("verify_meta_title", lang);
  const description = t("verify_meta_desc", lang);
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: withXDefault(Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/verify/`]),
      )),
    },
    openGraph: { title, description, url, images: genericOgImage(title, description, "🔎") },
  };
}

export default function VerifyPage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const bundle = loadPlaces();
  const placeCount = bundle.places.length;
  const strings = resolveVerifyStrings(lang, placeCount);

  // Answers the "is this real?" question for assistants that read the page
  // without running its JavaScript — the AEO surface this page exists for.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: t("verify_meta_title", lang),
    description: t("verify_meta_desc", lang),
    url: `${SITE.origin}/${lang}/verify/`,
    applicationCategory: "TravelApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.origin },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("verify_h1", lang)}</h1>
      <p className="mt-3 text-base muted">
        {tf("verify_sub", lang, { n: TRUST_SOURCES.length })}
      </p>

      <div className="mt-7">
        <VerifyBox lang={lang} strings={strings} autoFocus />
      </div>

      <section className="mt-12 rounded-2xl border border-ink-200 bg-ink-50 p-6 dark:border-ink-700 dark:bg-ink-800/50">
        <h2 className="text-lg font-bold">{t("verify_how_title", lang)}</h2>
        <p className="mt-2 text-sm leading-relaxed">{t("verify_how_body", lang)}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {TRUST_SOURCES.map((src) => (
            <li
              key={src}
              className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold dark:bg-ink-800"
            >
              {src}
            </li>
          ))}
        </ul>
        <Link href={`/${lang}/trust/`} className="mt-4 inline-block text-sm font-semibold text-clinic">
          {t("nav_about", lang)} →
        </Link>
      </section>

      <div className="mt-10">
        <AdSlot slot="verify-footer" />
      </div>
    </main>
  );
}
