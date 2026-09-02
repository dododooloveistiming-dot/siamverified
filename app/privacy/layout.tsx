import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { t } from "@/lib/i18n";

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header lang="en" navForBusiness={t("nav_for_business", "en")} navSaved={t("nav_saved", "en")} navVerify={t("verify_nav", "en")} />
      {children}
      <SiteFooter lang="en" />
    </>
  );
}
