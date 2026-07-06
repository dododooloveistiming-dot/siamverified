import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

export default function ForBusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header lang="en" />
      {children}
      <SiteFooter lang="en" />
    </>
  );
}
