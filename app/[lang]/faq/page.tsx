import type { Metadata } from "next";
import Link from "next/link";
import { listFaqs } from "@/lib/faqs";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { NICHE_META } from "@/lib/types";

export const dynamic = "force-static";

export function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Lang };
}): Promise<Metadata> {
  const url = `${SITE.origin}/${params.lang}/faq/`;
  return {
    title: `FAQ — Thailand yoga, spa, muay thai, diving · ${SITE.name}`,
    description: `Common questions about Thailand wellness, spa, muay thai, yoga retreats, diving certification, and digital nomad coworking. Real data from ${listFaqs().length} curated entries.`,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/faq/`])),
    },
  };
}

export default function FaqIndexPage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const faqs = listFaqs();
  const byTopic = faqs.reduce((acc, f) => {
    if (!acc[f.topic]) acc[f.topic] = [];
    acc[f.topic].push(f);
    return acc;
  }, {} as Record<string, typeof faqs>);

  return (
    <main className="pb-20">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 py-14 text-white sm:py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4">
          <nav className="text-xs text-white/80">
            <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
            <span className="mx-2">/</span>
            <span>FAQ</span>
          </nav>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
            Thailand wellness FAQ
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white/90">
            Honest answers to the most common questions about yoga retreats, muay thai camps,
            spa pricing, diving, and digital nomad life in Thailand.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm ring-1 ring-white/30">
            {faqs.length} curated questions · cross-checked against 6 sources
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12">
        {Object.entries(byTopic).map(([topic, list]) => {
          const isGeneral = topic === "general";
          const meta = !isGeneral
            ? NICHE_META[topic as keyof typeof NICHE_META]
            : undefined;
          const topicLabel = isGeneral ? "General" : meta?.name?.en ?? topic;
          return (
            <section key={topic} className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold tracking-tight">
                <span>{isGeneral ? "❓" : meta?.emoji ?? "❓"}</span>
                <span>{topicLabel}</span>
              </h2>
              <ul className="space-y-2">
                {list.map((f) => (
                  <li key={f.slug}>
                    <Link
                      href={`/${lang}/faq/${f.slug}/`}
                      className="block rounded-2xl border border-ink-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow dark:border-ink-800 dark:bg-ink-900"
                    >
                      <h3 className="text-base font-bold leading-snug">{f.question}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed muted">
                        {f.shortAnswer}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Schema.org FAQPage with all questions */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.shortAnswer,
              },
            })),
          }),
        }}
      />
    </main>
  );
}
