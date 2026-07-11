import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";

// Primary above-the-fold action: direct inquiry to the venue (0% commission,
// first-party lead — not an affiliate booking link). Scrolls to the on-page
// inquiry form.
export default function PrimaryCTA({ lang }: { lang: Lang }) {
  return (
    <section className="mt-4">
      <a
        href="#book"
        className="block rounded-xl bg-emerald-600 px-4 py-3 text-center text-base font-black text-white shadow-sm transition hover:bg-emerald-700"
      >
        📩 {t("cta_inquiry_main", lang)}
      </a>
    </section>
  );
}
