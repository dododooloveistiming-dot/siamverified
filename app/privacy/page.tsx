import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/i18n";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE.name}`,
  description: `How ${SITE.name} collects and uses data — analytics, advertising, and the business directory listings themselves.`,
  alternates: { canonical: `${SITE.origin}/privacy/` },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-ink-800 dark:text-ink-200">
      <nav className="text-xs text-ink-500">
        <Link href="/en/" className="hover:underline">{SITE.name}</Link>
        <span className="mx-2">/</span>
        <span>Privacy Policy</span>
      </nav>

      <h1 className="mt-3 text-2xl font-black tracking-tight">Privacy Policy</h1>
      <p className="mt-1 text-xs text-ink-500">Last updated: 2026</p>

      <p className="mt-6">
        {SITE.name} ({SITE.origin}) is an independent directory of Thailand-based businesses
        (Muay Thai gyms, yoga studios, spas, dive shops, cooking schools, coworking spaces,
        and wellness venues). This page explains what data we collect, why, and the choices
        you have.
      </p>

      <h2 className="mt-8 text-lg font-bold">1. Business listing data</h2>
      <p className="mt-2">
        Almost everything on this site — business names, addresses, ratings, review excerpts,
        photos — is aggregated from public sources (Google Maps/Search, Reddit, Naver, Pantip,
        YouTube) and describes businesses, not individual site visitors. If you believe your
        personal information appears on this site in a review excerpt or photo and want it
        removed, contact us (see Section 7).
      </p>

      <h2 className="mt-8 text-lg font-bold">2. Analytics</h2>
      <p className="mt-2">
        We use Google Analytics 4 (GA4) to understand aggregate traffic — which pages get
        visited, from which country/language, and how people navigate the site. GA4 uses
        cookies and similar technologies and may collect your IP address, device type, and
        browsing behavior on this site. See{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-emerald-700 underline dark:text-emerald-400">
          Google's Privacy Policy
        </a>{" "}
        for how Google handles this data.
      </p>

      <h2 className="mt-8 text-lg font-bold">3. Advertising</h2>
      <p className="mt-2">
        {SITE.name} is funded by display advertising. Once our advertising partner (Google
        AdSense) is active on this site, third-party vendors, including Google, may use
        cookies to serve ads based on your prior visits to this or other websites. Google's
        use of advertising cookies enables it and its partners to serve ads based on your
        visit to this site and/or other sites on the Internet. You may opt out of
        personalized advertising by visiting{" "}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener" className="text-emerald-700 underline dark:text-emerald-400">
          Google's Ads Settings
        </a>
        , or generally at{" "}
        <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener" className="text-emerald-700 underline dark:text-emerald-400">
          aboutads.info/choices
        </a>
        .
      </p>

      <h2 className="mt-8 text-lg font-bold">4. Inquiry and booking forms</h2>
      <p className="mt-2">
        When you send an inquiry or booking request to a listed business through this site,
        we collect the name, email, phone number, and message you provide. This is sent
        directly to the business (and, for operational monitoring, to us) so they can respond
        to you — it is not sold or used for advertising. We keep a record of inquiries to
        prevent abuse (rate limiting) and to show business owners their inquiry history.
      </p>

      <h2 className="mt-8 text-lg font-bold">5. Account sign-in</h2>
      <p className="mt-2">
        Business owners who claim a listing sign in via a one-time email link (no password).
        We store your email address and account activity (claims, listing edits) in our
        database to operate the owner dashboard. We do not share this with advertisers.
      </p>

      <h2 className="mt-8 text-lg font-bold">6. Local storage (wishlist, recently viewed)</h2>
      <p className="mt-2">
        Features like your saved wishlist and recently-viewed places are stored only in your
        browser's local storage — never sent to our servers. Clearing your browser data
        removes them.
      </p>

      <h2 className="mt-8 text-lg font-bold">7. Your choices &amp; contact</h2>
      <p className="mt-2">
        You can use most of this site without providing any personal information. To ask
        about data we hold about you, request removal of content, or ask a question about
        this policy, contact us via the{" "}
        <Link href="/en/about/" className="text-emerald-700 underline dark:text-emerald-400">About &amp; Contact</Link>{" "}
        page.
      </p>

      <h2 className="mt-8 text-lg font-bold">8. Changes to this policy</h2>
      <p className="mt-2">
        We may update this policy as the site's analytics or advertising setup changes.
        Material changes will update the "Last updated" date above.
      </p>
    </main>
  );
}
