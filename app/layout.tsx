import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.origin),
  title: { default: SITE.name, template: `%s — ${SITE.name}` },
  description: SITE.tagline.en,
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%2310b981'/%3E%3Cpath d='M28 50l16 16 32-32' fill='none' stroke='white' stroke-width='12' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    type: "website",
    url: SITE.origin,
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.tagline.en,
  },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.tagline.en },
  alternates: { canonical: SITE.origin },
  // Search engine verification. Replace the empty strings via Vercel env or
  // directly here once each Search Console issues a code.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFY ?? "",
    other: {
      // Naver Search Advisor — set after registering verifiedthai.com at
      // https://searchadvisor.naver.com/ (we ship a file under public/ OR a
      // meta tag — we use the meta tag flavor here).
      "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFY ?? "",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect Google's photo CDN so the first hero photo paints
            ~150ms faster. Most place pages serve from this origin. */}
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        {/* Same for streetview / maps photo URLs that occasionally appear */}
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
