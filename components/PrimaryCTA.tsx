import type { Lang, Place } from "@/lib/types";
import { t } from "@/lib/i18n";

// Smart primary action: if the place is bookable through an affiliate
// (revenue), lead with "check availability"; otherwise lead with the direct
// inquiry. Buttons route to the existing affiliate link / on-page #book form.
export default function PrimaryCTA({
  place,
  lang,
  hasKlookProducts,
}: {
  place: Place;
  lang: Lang;
  hasKlookProducts: boolean;
}) {
  const bookUrl = place.affiliate.klook || place.affiliate.agoda || "";
  const bookable = hasKlookProducts || !!bookUrl;

  return (
    <section className="mt-4">
      {bookable ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr]">
          <a
            href={hasKlookProducts ? "#book" : bookUrl}
            target={hasKlookProducts ? undefined : "_blank"}
            rel={hasKlookProducts ? undefined : "nofollow sponsored noopener"}
            className="rounded-xl bg-rose-600 px-4 py-3 text-center text-base font-black text-white shadow-sm transition hover:bg-rose-700"
          >
            ⚡ {t("cta_check_booking", lang)}
          </a>
          <a
            href="#book"
            className="rounded-xl border-2 border-emerald-500 px-4 py-3 text-center text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          >
            {t("cta_inquiry_short", lang)}
          </a>
        </div>
      ) : (
        <a
          href="#book"
          className="block rounded-xl bg-emerald-600 px-4 py-3 text-center text-base font-black text-white shadow-sm transition hover:bg-emerald-700"
        >
          📩 {t("cta_inquiry_main", lang)}
        </a>
      )}
    </section>
  );
}
