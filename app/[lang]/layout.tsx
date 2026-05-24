import type { Lang } from "@/lib/types";
import { SUPPORTED_LANGS } from "@/lib/i18n";
import Header from "@/components/Header";
import SetHtmlLang from "@/components/SetHtmlLang";

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
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: NO_FOUC }} />
      <SetHtmlLang lang={lang} />
      <Header lang={lang} />
      {children}
    </>
  );
}
