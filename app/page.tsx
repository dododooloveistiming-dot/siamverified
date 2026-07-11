// Root "/" — render a tiny page with the verification meta tags inherited
// from app/layout.tsx, plus a meta-refresh to /en/ for real users.
//
// Why not next/navigation redirect()? Because it returns a body of
// id="__next_error__", which Google Search Console verification sees as
// empty / failed — even though the actual response is 307. With a real
// page render here, the layout-level <meta name="google-site-verification">
// is present in the HTML and verification passes.
import type { Metadata } from "next";
import { SITE } from "@/lib/i18n";

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.tagline.en,
  alternates: { canonical: `${SITE.origin}/en/` },
};

export default function RootPage() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", textAlign: "center" }}>
      {/* Next's `metadata.other` renders <meta name="refresh" ...>, which
          browsers ignore — only <meta http-equiv="refresh" ...> actually
          redirects. That was dead weight; this is the real thing, so
          non-JS clients (and JS clients before the script below runs) also
          redirect, not just the "modern browser with JS" case. */}
      <meta httpEquiv="refresh" content="0;url=/en/" />
      <p>
        Redirecting to <a href="/en/">{SITE.name}</a>…
      </p>
      <script
        dangerouslySetInnerHTML={{
          __html: `setTimeout(() => { window.location.replace('/en/'); }, 50);`,
        }}
      />
    </main>
  );
}
