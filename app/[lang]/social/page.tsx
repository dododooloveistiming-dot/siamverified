import type { Metadata } from "next";
import Link from "next/link";
import { SITE, SUPPORTED_LANGS, t, tf, withXDefault } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { nicheName } from "@/lib/types";
import { corroborated, socialEntries, thinEvidence } from "@/lib/social";
import type { SocialEntry } from "@/lib/social";
import { genericOgImage } from "@/lib/og";
import AdSlot from "@/components/AdSlot";

// See lib/social.ts for what this page is and, more importantly, what it
// deliberately is not.
export const dynamic = "force-static";

// The thin list is the point of the page, so it renders whole. The
// corroborated list is capped — it exists as reassurance and as internal
// links, and the category pages already do exhaustive browsing.
const CORROBORATED_SHOWN = 60;

export function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: { lang: Lang } }): Promise<Metadata> {
  const { lang } = params;
  const url = `${SITE.origin}/${lang}/social/`;
  const title = t("soc_meta_title", lang);
  const description = tf("soc_sub", lang, { total: socialEntries().length });
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: withXDefault(Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/social/`]),
      )),
    },
    openGraph: { title, description, url, images: genericOgImage(title, description, "📸") },
  };
}

function Row({ e, lang, tone }: { e: SocialEntry; lang: Lang; tone: "thin" | "ok" }) {
  const p = e.place;
  return (
    <li>
      <Link
        href={`/${lang}/place/${p.slug}/`}
        className={`flex items-center gap-3 rounded-xl border p-3 transition hover:border-clinic ${
          tone === "thin"
            ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/10"
            : "border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-800"
        }`}
      >
        <span
          className={`w-11 shrink-0 text-center font-mono text-lg font-bold ${
            tone === "thin"
              ? "text-amber-700 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {Math.round(p.trust_score)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{p.name}</span>
          <span className="block truncate text-xs muted">
            {p.city ? `${p.city} · ` : ""}
            {nicheName(p.niche, lang)} · {tf("soc_sources_short", lang, { n: e.sources })}
            {p.review_count ? ` · ${p.review_count.toLocaleString()} reviews` : ""}
          </span>
        </span>
        <span className="shrink-0 text-xs muted" aria-hidden>
          {e.instagram ? "📸" : ""}{e.tiktok ? "🎵" : ""}
        </span>
      </Link>
    </li>
  );
}

export default function SocialPage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const thin = thinEvidence();
  const ok = corroborated();
  const total = socialEntries().length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("soc_h1", lang)}</h1>
      <p className="mt-3 text-base muted">{tf("soc_sub", lang, { total: total.toLocaleString() })}</p>

      <Link
        href={`/${lang}/verify/`}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
      >
        🔎 {t("coll_verify_cta", lang)}
      </Link>

      <section className="mt-12">
        <h2 className="text-xl font-bold">{tf("soc_thin_h2", lang, { count: thin.length })}</h2>
        <p className="mt-2 max-w-2xl text-sm muted">{t("soc_thin_sub", lang)}</p>
        <ul className="mt-4 grid gap-2">
          {thin.map((e) => <Row key={e.place.slug} e={e} lang={lang} tone="thin" />)}
        </ul>
      </section>

      <div className="my-10">
        <AdSlot slot="social-mid" />
      </div>

      <section className="mt-4">
        <h2 className="text-xl font-bold">{tf("soc_ok_h2", lang, { count: ok.length })}</h2>
        <p className="mt-2 max-w-2xl text-sm muted">{t("soc_ok_sub", lang)}</p>
        <ul className="mt-4 grid gap-2">
          {ok.slice(0, CORROBORATED_SHOWN).map((e) => (
            <Row key={e.place.slug} e={e} lang={lang} tone="ok" />
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <AdSlot slot="social-footer" />
      </div>
    </main>
  );
}
