import type { Metadata } from "next";
import { SITE, t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

// page.tsx is a client component (localStorage-driven), so metadata has to
// live in this server layout instead — without it the page silently
// inherited the root layout's canonical (verifiedthai.com) and bare title
// for all 8 locale URLs. Content here is per-browser, not per-URL, so it's
// noindexed rather than given a "real" canonical.
export async function generateMetadata({
  params,
}: {
  params: { lang: Lang };
}): Promise<Metadata> {
  const url = `${SITE.origin}/${params.lang}/wishlist/`;
  return {
    title: `${t("nav_saved", params.lang)} — ${SITE.name}`,
    alternates: { canonical: url },
    robots: { index: false, follow: true },
  };
}

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
