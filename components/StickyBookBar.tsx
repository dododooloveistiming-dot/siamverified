"use client";
import type { Lang, Place } from "@/lib/types";
import { t } from "@/lib/i18n";

type Primary = { label: string; href: string; tone: string };

function pickPrimary(place: Place, lang: Lang): Primary | null {
  if (place.affiliate.klook)
    return { label: t("cta_book_klook", lang), href: place.affiliate.klook, tone: "bg-rose-600 hover:bg-rose-700" };
  if (place.affiliate.viator)
    return { label: t("cta_book_viator", lang), href: place.affiliate.viator, tone: "bg-emerald-600 hover:bg-emerald-700" };
  if (place.affiliate.getyourguide)
    return { label: t("cta_book_gyg", lang), href: place.affiliate.getyourguide, tone: "bg-orange-600 hover:bg-orange-700" };
  if (place.affiliate.agoda)
    return { label: t("cta_book_agoda", lang), href: place.affiliate.agoda, tone: "bg-sky-600 hover:bg-sky-700" };
  if (place.affiliate.bookimed)
    return { label: "Get Free Quote", href: place.affiliate.bookimed, tone: "bg-blue-600 hover:bg-blue-700" };
  return null;
}

export default function StickyBookBar({ place, lang }: { place: Place; lang: Lang }) {
  const primary = pickPrimary(place, lang);
  if (!primary && !place.phone && !place.google_maps_url) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 px-3 py-2 backdrop-blur dark:border-ink-800 dark:bg-ink-950/95 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-2">
        {place.phone && (
          <a
            href={`tel:${place.phone}`}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-ink-200 text-emerald-700 transition active:scale-95 dark:border-ink-700 dark:text-emerald-400"
            aria-label="Call"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.91.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>
        )}
        {place.google_maps_url && (
          <a
            href={place.google_maps_url}
            target="_blank"
            rel="noopener"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-ink-200 transition active:scale-95 dark:border-ink-700"
            aria-label={t("cta_view_map", lang)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </a>
        )}
        {primary ? (
          <a
            href={primary.href}
            target="_blank"
            rel="nofollow sponsored noopener"
            className={`flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white shadow-sm transition active:scale-[0.98] ${primary.tone}`}
          >
            <span className="truncate">{primary.label}</span>
            <span aria-hidden="true">→</span>
          </a>
        ) : (
          <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-ink-100 text-sm font-medium muted dark:bg-ink-800">
            ↑ See details above
          </div>
        )}
      </div>
    </div>
  );
}
