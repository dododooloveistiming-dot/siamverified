import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFaq, listFaqs } from "@/lib/faqs";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { NICHE_META } from "@/lib/types";

export const dynamic = "force-static";

export function generateStaticParams() {
  const params: Array<{ lang: Lang; slug: string }> = [];
  for (const lang of SUPPORTED_LANGS) {
    for (const f of listFaqs()) {
      params.push({ lang, slug: f.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Lang; slug: string };
}): Promise<Metadata> {
  const faq = getFaq(params.slug);
  if (!faq) return {};
  const url = `${SITE.origin}/${params.lang}/faq/${params.slug}/`;
  return {
    title: `${faq.question} — ${SITE.name}`,
    description: faq.shortAnswer,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/faq/${params.slug}/`]),
      ),
    },
    openGraph: {
      title: faq.question,
      description: faq.shortAnswer,
      url,
      type: "article",
    },
  };
}

export default function FaqDetailPage({
  params,
}: {
  params: { lang: Lang; slug: string };
}) {
  const faq = getFaq(params.slug);
  if (!faq) notFound();
  const lang = params.lang;
  const meta =
    faq.topic !== "general"
      ? NICHE_META[faq.topic as keyof typeof NICHE_META]
      : undefined;

  const relatedFaqs = faq.related
    .map((slug) => getFaq(slug))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  const paragraphs = faq.longAnswer.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <main className="pb-20">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-ink-50 to-emerald-50 py-12 dark:from-ink-900 dark:to-emerald-950/40 sm:py-16">
        <div className="relative mx-auto max-w-3xl px-4">
          <nav className="text-xs muted">
            <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${lang}/faq/`} className="hover:underline">FAQ</Link>
            {faq.topic !== "general" && meta && (
              <>
                <span className="mx-2">/</span>
                <span>{meta.name?.en ?? faq.topic}</span>
              </>
            )}
          </nav>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <span>{meta?.emoji ?? "❓"}</span>
            <span className="uppercase tracking-wide">{faq.topic.replace("-", " ")}</span>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            {faq.question}
          </h1>
          <div className="mt-5 rounded-2xl border-l-4 border-emerald-500 bg-white p-5 text-base font-medium leading-relaxed dark:bg-ink-900">
            {faq.shortAnswer}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Long answer */}
        <article className="prose prose-lg dark:prose-invert max-w-none">
          {paragraphs.map((p, i) => {
            // Render simple **bold** within paragraphs
            const parts = p.split(/(\*\*[^*]+\*\*)/g);
            return (
              <p key={i} className="text-base leading-relaxed">
                {parts.map((part, j) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <strong key={j} className="font-bold">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={j}>{part}</span>;
                })}
              </p>
            );
          })}
        </article>

        {/* Related */}
        {relatedFaqs.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold tracking-tight">Related questions</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {relatedFaqs.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/${lang}/faq/${r.slug}/`}
                    className="block rounded-xl border border-ink-100 bg-white p-3 text-sm transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
                  >
                    <h3 className="font-semibold leading-snug">{r.question}</h3>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 text-xs muted">
          <Link href={`/${lang}/faq/`} className="hover:underline">
            ← All FAQs
          </Link>
        </div>
      </div>

      {/* Schema.org QAPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "QAPage",
            mainEntity: {
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.shortAnswer + "\n\n" + faq.longAnswer,
              },
            },
          }),
        }}
      />
    </main>
  );
}
