import { SITE, t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export default function SiteFooter({ lang }: { lang: Lang }) {
  return (
    <footer className="mt-16 border-t border-ink-100 dark:border-ink-800">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-ink-600 dark:text-ink-400">
        {/* From our family — sibling sites */}
        <div className="mb-8">
          <div className="mb-3 text-xs uppercase tracking-wide font-bold text-ink-900 dark:text-ink-100">
            From our family
          </div>
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <a
              href={SITE.origin}
              className="block rounded-lg border border-ink-100 bg-white p-3 transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
            >
              <div className="font-bold text-ink-900 dark:text-ink-100">✅ Verified Thai</div>
              <div className="mt-1 leading-snug">
                Yoga · spa · muay thai · diving · cooking · coworking · wellness directory.
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wide opacity-60">You are here</div>
            </a>
            <a
              href="https://thailandgolfguide.com"
              target="_blank"
              rel="noopener"
              className="block rounded-lg border border-ink-100 bg-white p-3 transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
            >
              <div className="font-bold text-ink-900 dark:text-ink-100">⛳ Thailand Golf Guide</div>
              <div className="mt-1 leading-snug">
                Independent reviews of Thai golf courses — booking, caddy, package deals.
              </div>
            </a>
            <a
              href="https://thaisupplyhub.com"
              target="_blank"
              rel="noopener"
              className="block rounded-lg border border-ink-100 bg-white p-3 transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
            >
              <div className="font-bold text-ink-900 dark:text-ink-100">🏭 Thai Supply Hub</div>
              <div className="mt-1 leading-snug">
                Verified Thai OEM/ODM suppliers — B2B sourcing directory.
              </div>
            </a>
          </div>
        </div>

        {/* About / legal */}
        <div className="border-t border-ink-100 pt-6 dark:border-ink-800">
          <p className="max-w-3xl text-xs leading-relaxed">
            {t("footer_blurb", lang)}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>© {new Date().getFullYear()} {SITE.name}</div>
            <div>Sources: Google · Reddit · Naver · Pantip · YouTube · Bookimed · Official sites</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
