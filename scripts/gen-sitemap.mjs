// Build-time sitemap + robots generator for verifiedthai.com
//
// Runs before `next build` (see package.json "build" script). Emits static XML
// into public/ so it is immune to Next's trailingSlash routing quirks on the
// .xml metadata routes, and is regenerated on every weekly data refresh build
// so <lastmod> always tracks the data bundle.
//
// Output (served at site root on Vercel):
//   /sitemap.xml             -> sitemap index
//   /sitemap-pages.xml       -> home (per lang)
//   /sitemap-categories.xml  -> /c/<niche> (per lang)
//   /sitemap-places.xml      -> /place/<slug> (per lang)
//   /robots.txt
//
// Every <url> carries xhtml:link alternates for all 6 languages + x-default,
// matching the on-page hreflang so the two never drift.

import fs from "node:fs";
import path from "node:path";

const ORIGIN = "https://verifiedthai.com";
const LANGS = ["en", "ko", "th", "zh", "ja", "ar"];
const X_DEFAULT_LANG = "en";
const NICHES = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
];

const root = process.cwd();
const dataPath = path.join(root, "public", "data", "places.json");
const publicDir = path.join(root, "public");

const bundle = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

// lastmod = the data bundle's generation date (YYYY-MM-DD). Falls back to the
// file mtime if generated_at is missing/unparseable.
function isoDate(value, fallbackFile) {
  const d = value ? new Date(value) : null;
  if (d && !Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return fs.statSync(fallbackFile).mtime.toISOString().slice(0, 10);
}
const LASTMOD = isoDate(bundle.generated_at, dataPath);

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Build a path template that contains `{lang}`, e.g. "/{lang}/c/spa/".
// Emits one <url> per language, each listing all language alternates + x-default.
function urlSet(pathTemplates) {
  const out = [];
  for (const tpl of pathTemplates) {
    const links = LANGS.map(
      (l) =>
        `    <xhtml:link rel="alternate" hreflang="${l}" href="${xmlEscape(
          ORIGIN + tpl.replace("{lang}", l)
        )}"/>`
    );
    links.push(
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(
        ORIGIN + tpl.replace("{lang}", X_DEFAULT_LANG)
      )}"/>`
    );
    const altBlock = links.join("\n");
    for (const l of LANGS) {
      const loc = xmlEscape(ORIGIN + tpl.replace("{lang}", l));
      out.push(
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n${altBlock}\n  </url>`
      );
    }
  }
  return out;
}

function urlsetDoc(urls) {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls.join("\n") +
    `\n</urlset>\n`
  );
}

// --- pages (home) ---
const pagesUrls = urlSet(["/{lang}/"]);

// --- categories ---
const categoryUrls = urlSet(NICHES.map((n) => `/{lang}/c/${n}/`));

// --- places ---
const placeUrls = urlSet(
  bundle.places.map((p) => `/{lang}/place/${p.slug}/`)
);

const files = [
  ["sitemap-pages.xml", urlsetDoc(pagesUrls)],
  ["sitemap-categories.xml", urlsetDoc(categoryUrls)],
  ["sitemap-places.xml", urlsetDoc(placeUrls)],
];

for (const [name, content] of files) {
  fs.writeFileSync(path.join(publicDir, name), content);
}

// --- sitemap index ---
const index =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  files
    .map(
      ([name]) =>
        `  <sitemap>\n    <loc>${ORIGIN}/${name}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n  </sitemap>`
    )
    .join("\n") +
  `\n</sitemapindex>\n`;
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), index);

// --- robots.txt ---
const robots =
  `User-agent: *\n` +
  `Allow: /\n` +
  `Disallow: /dashboard\n` +
  `Disallow: /api\n` +
  `Disallow: /auth\n` +
  `\n` +
  `Sitemap: ${ORIGIN}/sitemap.xml\n`;
fs.writeFileSync(path.join(publicDir, "robots.txt"), robots);

console.log(
  `[gen-sitemap] lastmod=${LASTMOD}\n` +
    `  sitemap-pages.xml       ${pagesUrls.length} urls\n` +
    `  sitemap-categories.xml  ${categoryUrls.length} urls\n` +
    `  sitemap-places.xml      ${placeUrls.length} urls\n` +
    `  total                   ${pagesUrls.length + categoryUrls.length + placeUrls.length} urls`
);
