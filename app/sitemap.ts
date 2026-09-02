import type { MetadataRoute } from "next";
import { loadPlaces, loadBlogPosts, getPlacesByNiche } from "@/lib/data";
import { CITIES as CITY_DEFS, placesInCity } from "@/lib/cities";
import { listFaqs, isFaqTranslated, faqTranslatedLangs } from "@/lib/faqs";
import { SITE, SUPPORTED_LANGS, withXDefault } from "@/lib/i18n";
import { isIndexablePlace } from "@/lib/reviews";
import { hasEnoughGuidePlaces, CITY_SLUGS as GUIDE_CITY_SLUGS } from "@/lib/guides";
import { MONTH_SLUGS } from "@/lib/seasons";
import type { Niche } from "@/lib/types";

// Mirrors definitions used by app/[lang]/guide/[slug] and /compare/[slug]
const NICHES: Niche[] = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
];
const CITIES = [
  "bangkok", "chiang-mai", "phuket", "pattaya", "hua-hin", "koh-samui",
];
// koh-tao has no city hub (lib/cities.ts) and ~0 places in the dataset — a
// "phuket vs koh-tao" compare page would render with an empty second column.
const COMPARE_PAIRS: Array<[string, string]> = [
  ["bangkok", "chiang-mai"],
  ["bangkok", "phuket"],
  ["chiang-mai", "pattaya"],
  ["bangkok", "koh-samui"],
  ["pattaya", "hua-hin"],
  ["phuket", "koh-samui"],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = SITE.origin;
  const now = new Date();
  const out: MetadataRoute.Sitemap = [];

  // Root
  out.push({ url: `${origin}/`, lastModified: now, priority: 1.0, changeFrequency: "weekly" });

  // For-business landing (owner acquisition funnel)
  out.push({ url: `${origin}/for-business/`, lastModified: now, priority: 0.85, changeFrequency: "monthly" });
  out.push({ url: `${origin}/privacy/`, lastModified: now, priority: 0.3, changeFrequency: "yearly" });

  for (const lang of SUPPORTED_LANGS) {
    // Verify tool — the social-handle lookup landing
    out.push({
      url: `${origin}/${lang}/verify/`,
      lastModified: now,
      priority: 0.9,
      changeFrequency: "weekly",
      alternates: {
        languages: withXDefault(Object.fromEntries(
          SUPPORTED_LANGS.map((l) => [l, `${origin}/${l}/verify/`]),
        )),
      },
    });

    // Lang landing
    out.push({
      url: `${origin}/${lang}/`,
      lastModified: now,
      priority: 0.9,
      changeFrequency: "weekly",
      alternates: {
        languages: withXDefault(Object.fromEntries(
          SUPPORTED_LANGS.map((l) => [l, `${origin}/${l}/`]),
        )),
      },
    });

    // Seasonal /thailand-in/[month]/ pages — evergreen, recurring annual demand
    for (const slug of MONTH_SLUGS.slice(1)) {
      out.push({
        url: `${origin}/${lang}/thailand-in/${slug}/`,
        lastModified: now,
        priority: 0.7,
        changeFrequency: "monthly",
        alternates: {
          languages: withXDefault(Object.fromEntries(
            SUPPORTED_LANGS.map((l) => [l, `${origin}/${l}/thailand-in/${slug}/`]),
          )),
        },
      });
    }

    // Niche category pages
    for (const n of NICHES) {
      out.push({
        url: `${origin}/${lang}/c/${n}/`,
        lastModified: now,
        priority: 0.85,
        changeFrequency: "weekly",
      });
      // Filter sub-pages (enrichment-signal driven SEO targets)
      for (const f of ["established", "active"]) {
        out.push({
          url: `${origin}/${lang}/c/${n}/${f}/`,
          lastModified: now,
          priority: 0.8,
          changeFrequency: "weekly",
        });
      }
    }

    // City hub pages (NEW — per-city landing pages)
    for (const c of CITIES) {
      out.push({
        url: `${origin}/${lang}/city/${c}/`,
        lastModified: now,
        priority: 0.85,
        changeFrequency: "weekly",
      });
    }

    // City × niche guide pages — skip combos below the "real ranked list"
    // threshold (see hasEnoughGuidePlaces); several have zero matches (e.g.
    // Hua Hin diving) and were previously sitemapped as "Top 0 …" pages.
    for (const c of GUIDE_CITY_SLUGS) {
      for (const n of NICHES) {
        if (!hasEnoughGuidePlaces(c, n)) continue;
        out.push({
          url: `${origin}/${lang}/guide/${c.slug}-${n}/`,
          lastModified: now,
          priority: 0.8,
          changeFrequency: "weekly",
        });
      }
    }

    // /best/{city}-{niche}-{kind}/ — handcrafted long-tail SEO pages.
    // Only emit combos with ≥5 matching places (avoid thin content).
    for (const city of CITY_DEFS) {
      for (const n of NICHES) {
        const inCity = placesInCity(getPlacesByNiche(n), city);
        for (const [kind, pred] of [
          ["established", (p: typeof inCity[0]) => p.is_established],
          ["active", (p: typeof inCity[0]) => p.is_active_recently],
        ] as const) {
          if (inCity.filter(pred).length >= 5) {
            out.push({
              url: `${origin}/${lang}/best/${city.slug}-${n}-${kind}/`,
              lastModified: now,
              priority: 0.8,
              changeFrequency: "monthly",
            });
          }
        }
      }
    }

    // Compare pages
    for (const [a, b] of COMPARE_PAIRS) {
      out.push({
        url: `${origin}/${lang}/compare/${a}-vs-${b}/`,
        lastModified: now,
        priority: 0.75,
        changeFrequency: "monthly",
      });
    }

    // Trust methodology — authoritative single-page explainer
    out.push({ url: `${origin}/${lang}/trust/`, lastModified: now, priority: 0.85, changeFrequency: "monthly" });

    // FAQ index + each FAQ. Only emit a locale's FAQ URL when it's genuinely
    // translated (en always) — untranslated locales serve an English fallback
    // and would be duplicate content under a mismatched hreflang.
    out.push({ url: `${origin}/${lang}/faq/`, lastModified: now, priority: 0.75, changeFrequency: "monthly" });
    for (const f of listFaqs()) {
      if (!isFaqTranslated(f, lang)) continue;
      out.push({
        url: `${origin}/${lang}/faq/${f.slug}/`,
        lastModified: now,
        priority: 0.7,
        changeFrequency: "monthly",
        alternates: {
          languages: withXDefault(Object.fromEntries(
            faqTranslatedLangs(f, SUPPORTED_LANGS).map((l) => [l, `${origin}/${l}/faq/${f.slug}/`]),
          )),
        },
      });
    }

    // Korean blog index + each post (Korean-targeted long-tail SEO). The
    // post body is Korean-only regardless of `lang` (no translation
    // pipeline), so only the /ko/ URL is real — other locales canonicalize
    // to it and are noindexed (see blog/[slug]/page.tsx generateMetadata).
    out.push({ url: `${origin}/${lang}/blog/`, lastModified: now, priority: 0.75, changeFrequency: "weekly" });
  }
  for (const post of loadBlogPosts()) {
    out.push({
      url: `${origin}/ko/blog/${post.slug}/`,
      lastModified: new Date(post.generated_at),
      priority: 0.75,
      changeFrequency: "monthly",
    });
  }

  // Place pages — large set, lower priority. Use single lang (en) per place
  // to avoid 12K+ entries × 6 langs swamping Google's crawl budget; engines
  // pick up other langs via hreflang on the en page.
  const bundle = loadPlaces();
  // `enriched_at` doesn't exist on the bundle (the real field is
  // `generated_at`) — every place lastmod was silently falling back to
  // build time, telling Google "everything changed" on every deploy.
  const lastMod = bundle.generated_at ? new Date(bundle.generated_at) : now;
  // Only emit substantive pages — thin places are noindexed (see lib/reviews).
  for (const p of bundle.places.filter(isIndexablePlace)) {
    out.push({
      url: `${origin}/en/place/${p.slug}/`,
      lastModified: lastMod,
      priority: 0.6,
      changeFrequency: "monthly",
    });
  }

  return out;
}
