import type { MetadataRoute } from "next";
import { loadPlaces, loadBlogPosts } from "@/lib/data";
import { listFaqs } from "@/lib/faqs";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import type { Niche } from "@/lib/types";

// Mirrors definitions used by app/[lang]/guide/[slug] and /compare/[slug]
const NICHES: Niche[] = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
];
const CITIES = [
  "bangkok", "chiang-mai", "phuket", "pattaya", "hua-hin", "koh-samui",
];
const COMPARE_PAIRS: Array<[string, string]> = [
  ["bangkok", "chiang-mai"],
  ["phuket", "koh-tao"],
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

  for (const lang of SUPPORTED_LANGS) {
    // Lang landing
    out.push({
      url: `${origin}/${lang}/`,
      lastModified: now,
      priority: 0.9,
      changeFrequency: "weekly",
      alternates: {
        languages: Object.fromEntries(
          SUPPORTED_LANGS.map((l) => [l, `${origin}/${l}/`]),
        ),
      },
    });

    // Niche category pages
    for (const n of NICHES) {
      out.push({
        url: `${origin}/${lang}/c/${n}/`,
        lastModified: now,
        priority: 0.85,
        changeFrequency: "weekly",
      });
    }

    // City × niche guide pages
    for (const c of CITIES) {
      for (const n of NICHES) {
        out.push({
          url: `${origin}/${lang}/guide/${c}-${n}/`,
          lastModified: now,
          priority: 0.8,
          changeFrequency: "weekly",
        });
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

    // FAQ index + each FAQ
    out.push({ url: `${origin}/${lang}/faq/`, lastModified: now, priority: 0.75, changeFrequency: "monthly" });
    for (const f of listFaqs()) {
      out.push({
        url: `${origin}/${lang}/faq/${f.slug}/`,
        lastModified: now,
        priority: 0.7,
        changeFrequency: "monthly",
      });
    }

    // Korean blog index + each post (Korean-targeted long-tail SEO)
    out.push({ url: `${origin}/${lang}/blog/`, lastModified: now, priority: 0.75, changeFrequency: "weekly" });
    for (const post of loadBlogPosts()) {
      out.push({
        url: `${origin}/${lang}/blog/${post.slug}/`,
        lastModified: new Date(post.generated_at),
        priority: 0.75,
        changeFrequency: "monthly",
        alternates: {
          languages: Object.fromEntries(
            SUPPORTED_LANGS.map((l) => [l, `${origin}/${l}/blog/${post.slug}/`]),
          ),
        },
      });
    }
  }

  // Place pages — large set, lower priority. Use single lang (en) per place
  // to avoid 12K+ entries × 6 langs swamping Google's crawl budget; engines
  // pick up other langs via hreflang on the en page.
  const bundle = loadPlaces();
  const enrichedAt = (bundle as unknown as { enriched_at?: string }).enriched_at;
  const lastMod = enrichedAt ? new Date(enrichedAt) : now;
  for (const p of bundle.places) {
    out.push({
      url: `${origin}/en/place/${p.slug}/`,
      lastModified: lastMod,
      priority: 0.6,
      changeFrequency: "monthly",
    });
  }

  return out;
}
