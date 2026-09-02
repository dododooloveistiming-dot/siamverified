import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { SUPPORTED_LANGS } from "@/lib/site";
import { t } from "@/lib/i18n";
import Header from "@/components/Header";
import SetHtmlLang from "@/components/SetHtmlLang";
import SiteFooter from "@/components/SiteFooter";

export function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }));
}

const NO_FOUC =
  "(function(){try{var s=localStorage.getItem('theme');var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();";

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: Lang };
}) {
  const { lang } = params;
  if (!SUPPORTED_LANGS.includes(lang)) notFound();
  // The root layout (app/layout.tsx) owns the single <html> tag shared by
  // every locale and hardcodes lang="en" — it can't read the [lang] segment
  // without opting the entire static site into per-request dynamic
  // rendering (headers()/cookies() would force all ~3,500 static pages to
  // render on demand). Set the real attributes synchronously, before first
  // paint, the same way NO_FOUC above avoids a dark-mode flash — this fixes
  // the visible RTL flash for Arabic; SetHtmlLang's effect then keeps it
  // correct across client-side locale-switch navigations (which don't
  // reload the document, so this inline script doesn't re-run).
  const SET_LANG_DIR = `document.documentElement.lang=${JSON.stringify(lang)};document.documentElement.dir=${JSON.stringify(lang === "ar" ? "rtl" : "ltr")};`;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: NO_FOUC }} />
      <script dangerouslySetInnerHTML={{ __html: SET_LANG_DIR }} />
      <SetHtmlLang lang={lang} />
      <Header lang={lang} navForBusiness={t("nav_for_business", lang)} navSaved={t("nav_saved", lang)} navVerify={t("verify_nav", lang)} />
      {children}
      <SiteFooter lang={lang} />
    </>
  );
}
