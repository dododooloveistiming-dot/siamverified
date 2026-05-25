import type { Metadata } from "next";
import Link from "next/link";
import { loadBlogPosts, getPlaceBySlug } from "@/lib/data";
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
  return {
    title: `Korean travel blog — ${SITE.name}`,
    description:
      "태국 여행자를 위한 무에타이 / 요가 / 다이빙 / 스파 추천 가이드. 데이터 기반, 광고비 없음.",
    alternates: {
      canonical: `${SITE.origin}/${params.lang}/blog/`,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/blog/`]),
      ),
    },
  };
}

export default function BlogIndex({ params }: { params: { lang: Lang } }) {
  const posts = loadBlogPosts();

  // Group by niche for browsing
  const byNiche = new Map<string, typeof posts>();
  for (const post of posts) {
    if (!byNiche.has(post.niche)) byNiche.set(post.niche, []);
    byNiche.get(post.niche)!.push(post);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Korean travel blog
        </h1>
        <p className="mt-2 text-sm muted">
          한국 여행자를 위한 태국 무에타이 / 요가 / 다이빙 / 스파 추천 가이드.
          데이터 기반, 광고비 없음. <span className="font-bold">{posts.length}개 글</span>.
        </p>
      </header>

      <div className="mt-8 space-y-12">
        {Array.from(byNiche.entries()).map(([niche, group]) => {
          const meta = NICHE_META[niche as keyof typeof NICHE_META];
          return (
            <section key={niche}>
              <h2 className="flex items-center gap-2 text-xl font-black">
                <span className="text-2xl">{meta?.emoji}</span>
                <span>{group[0].niche_ko}</span>
                <span className="text-sm font-normal muted">({group.length} 글)</span>
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((post) => {
                  const heroPlace = post.place_slugs
                    .map((s) => getPlaceBySlug(s))
                    .find((p) => p && p.top_photo_url);
                  return (
                    <li key={post.slug}>
                      <Link
                        href={`/${params.lang}/blog/${post.slug}/`}
                        className="group block overflow-hidden rounded-2xl border border-ink-100 bg-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow dark:border-ink-800 dark:bg-ink-900"
                      >
                        <div className="relative aspect-video bg-ink-100 dark:bg-ink-800">
                          {heroPlace?.top_photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={heroPlace.top_photo_url}
                              alt={post.title}
                              className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-4xl">
                              {meta?.emoji}
                            </div>
                          )}
                          <div className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-black text-ink-900 backdrop-blur dark:bg-ink-900/95 dark:text-ink-50">
                            {post.city_ko}
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="line-clamp-2 text-sm font-bold leading-snug">
                            {post.title}
                          </h3>
                          <div className="mt-1 text-[10px] muted">
                            {post.place_slugs.length}곳 추천
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
