import type { Metadata } from "next";
import Link from "next/link";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export const dynamic = "force-static";

export function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Lang };
}): Promise<Metadata> {
  const url = `${SITE.origin}/${params.lang}/about/`;
  return {
    title: `About & Contact — ${SITE.name}`,
    description:
      "Independent Thailand directory built by Shin Yunmin. No paid promotion, no influencer reviews — only data from 6 cross-verified sources.",
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/about/`])
      ),
    },
  };
}

export default function AboutPage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  return (
    <main className="pb-20">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 py-14 text-white sm:py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4">
          <nav className="text-xs text-white/80">
            <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
            <span className="mx-2">/</span>
            <span>About</span>
          </nav>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
            About &amp; Contact
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
            {SITE.tagline.en}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pt-10">
        <div className="rounded-2xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <img
              src="/founder.jpg"
              alt="Shin Yunmin — Founder"
              className="h-32 w-32 shrink-0 rounded-full object-cover border border-ink-100 dark:border-ink-800"
              loading="lazy"
            />
            <div>
              <div className="text-xs uppercase tracking-wide opacity-60">Founder</div>
              <h2 className="mt-1 text-2xl font-bold">Shin Yunmin (신윤민)</h2>
              <p className="mt-2 text-sm leading-relaxed opacity-80">
                Data architect, 12+ years. Korean founder based in Bangkok, building products for the Thai market.
              </p>
              <p className="mt-4 text-sm leading-relaxed">
                <strong>Why Verified Thai exists:</strong> Open Instagram or TikTok and search for a yoga studio, spa, or muay thai gym in Thailand — you'll get the same handful of places that paid influencers to film "10 best in Bangkok" reels. The actual best places get drowned out by whoever has the marketing budget. So I cross-checked every listing against <strong>6 independent sources</strong> — Google, Reddit, Naver, Pantip, YouTube, Bookimed, official sites — and ranked them on what real customers say. No payments. No "ambassador" deals. No filtered reels.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pt-8">
        <h2 className="mb-4 text-2xl font-bold">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="mailto:thaiconnect33@gmail.com"
            className="rounded-2xl border border-ink-100 bg-white p-5 transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
          >
            <div className="text-xs uppercase tracking-wide opacity-60">Email</div>
            <div className="mt-1 break-all font-bold">thaiconnect33@gmail.com</div>
            <div className="mt-1 text-xs opacity-70">Replies within 24 hours</div>
          </a>

          <a
            href="https://line.me/ti/p/~838wyfih"
            target="_blank"
            rel="noopener"
            className="rounded-2xl border border-ink-100 bg-white p-5 transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
          >
            <div className="text-xs uppercase tracking-wide opacity-60">LINE</div>
            <div className="mt-1 font-bold">@838wyfih</div>
            <div className="mt-1 text-xs opacity-70">Fastest for quick questions</div>
          </a>

          <a
            href="https://wa.me/66610934014"
            target="_blank"
            rel="noopener"
            className="rounded-2xl border border-ink-100 bg-white p-5 transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
          >
            <div className="text-xs uppercase tracking-wide opacity-60">WhatsApp / Phone</div>
            <div className="mt-1 font-bold">+66 61 093 4014</div>
            <div className="mt-1 text-xs opacity-70">EN · KO · TH</div>
          </a>

          <div className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div className="text-xs uppercase tracking-wide opacity-60">Bangkok office</div>
            <div className="mt-1 text-sm font-bold leading-snug">
              3rd floor, 272 Than Thip 3 Alley
            </div>
            <div className="text-sm leading-snug">Phlabphla, Wang Thonglang</div>
            <div className="text-sm leading-snug">Bangkok 10310</div>
          </div>
        </div>
      </section>
    </main>
  );
}
