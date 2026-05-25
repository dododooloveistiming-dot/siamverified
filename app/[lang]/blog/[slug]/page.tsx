import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadBlogPosts, getBlogPostBySlug, getPlaceBySlug } from "@/lib/data";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import PlacePlaceholder from "@/components/PlacePlaceholder";
import BlogMarkdown from "@/components/BlogMarkdown";

export const dynamic = "force-static";

export function generateStaticParams() {
  const posts = loadBlogPosts();
  const params: Array<{ lang: Lang; slug: string }> = [];
  for (const lang of SUPPORTED_LANGS) {
    for (const post of posts) {
      params.push({ lang, slug: post.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Lang; slug: string };
}): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug);
  if (!post) return {};
  const url = `${SITE.origin}/${params.lang}/blog/${post.slug}/`;
  const description = post.body_md
    .replace(/[#*>\-`\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return {
    title: `${post.title} | ${SITE.name}`,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/blog/${post.slug}/`]),
      ),
    },
    openGraph: {
      title: post.title,
      description,
      url,
      type: "article",
      locale: "ko_KR",
    },
  };
}

export default function BlogPostPage({
  params,
}: {
  params: { lang: Lang; slug: string };
}) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) notFound();

  // Resolve the listed places for the sidebar / picks rail
  const featured = post.place_slugs
    .map((s) => getPlaceBySlug(s))
    .filter((p): p is NonNullable<ReturnType<typeof getPlaceBySlug>> => !!p);
  const heroPhoto = featured.find((p) => p.top_photo_url)?.top_photo_url ?? null;

  const niche = post.niche as keyof typeof NICHE_META;
  const meta = NICHE_META[niche];

  // Article JSON-LD
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    inLanguage: "ko-KR",
    datePublished: post.generated_at,
    dateModified: post.generated_at,
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
    image: heroPhoto || undefined,
    mainEntityOfPage: `${SITE.origin}/${params.lang}/blog/${post.slug}/`,
    about: featured.slice(0, 5).map((p) => ({
      "@type": "LocalBusiness",
      name: p.name,
      address: { "@type": "PostalAddress", addressLocality: p.city, addressCountry: "TH" },
      ...(p.rating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: p.rating,
              reviewCount: p.review_count ?? 1,
            },
          }
        : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />

      <main className="pb-20">
        {/* HERO */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0">
            {heroPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroPhoto}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <PlacePlaceholder niche={niche} size="xl" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          </div>

          <div className="relative mx-auto max-w-3xl px-4 pt-10 pb-10 sm:pt-16 sm:pb-14">
            <nav className="text-xs text-white/80">
              <Link href={`/${params.lang}/`} className="hover:underline">
                {SITE.name}
              </Link>
              <span className="mx-2">/</span>
              <Link href={`/${params.lang}/blog/`} className="hover:underline">
                Blog
              </Link>
              <span className="mx-2">/</span>
              <span className="truncate">{post.title}</span>
            </nav>
            <div className="mt-24 sm:mt-32">
              <div className="text-3xl">{meta?.emoji}</div>
              <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                {post.title}
              </h1>
              <p className="mt-3 text-sm text-white/85 sm:text-base">
                {post.city_ko} · {post.niche_ko} · 한국 여행자 가이드
              </p>
            </div>
          </div>
        </section>

        {/* BODY + picks */}
        <article className="mx-auto max-w-3xl px-4">
          <BlogMarkdown source={post.body_md} />

          {/* CTA — go to listings */}
          <div className="mt-12 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-700 dark:bg-emerald-950/20">
            <div className="text-base font-black">
              마음에 드는 곳 있으면 무료 inquiry 보내세요 📩
            </div>
            <p className="mt-1 text-sm text-ink-700 dark:text-ink-300">
              한국어로 작성하셔도 자동 영어 번역 후 업체에 전달됩니다.
              답변은 보통 24시간 이내. 수수료 0%.
            </p>
            <Link
              href={`/${params.lang}/c/${post.niche}/`}
              className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
            >
              전체 {post.niche_ko} 목록 →
            </Link>
          </div>

          {/* BACK */}
          <div className="mt-8 text-xs muted">
            <Link href={`/${params.lang}/blog/`} className="hover:underline">
              ← Korean blog 인덱스
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
