import type { MetadataRoute } from "next";
import { SITE } from "@/lib/i18n";
import { BLOCKED_CRAWLERS } from "@/lib/crawlers";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // /api/og/ generates the social-share preview images referenced by
        // og:image/twitter:image — must stay crawlable even though the rest
        // of /api/ is blocked, or Twitter/Google can't fetch the card image.
        allow: ["/", "/api/og/"],
        // Don't waste crawl budget on auth flows / private dashboards
        disallow: ["/auth/", "/dashboard/", "/admin/", "/api/"],
      },
      // Naver's crawler — explicit allow + slow crawl to be polite
      {
        userAgent: "Yeti",
        allow: ["/", "/api/og/"],
        disallow: ["/auth/", "/dashboard/", "/admin/", "/api/"],
        crawlDelay: 1,
      },
      // Baidu — Chinese-language SEO
      {
        userAgent: "Baiduspider",
        allow: ["/", "/api/og/"],
        disallow: ["/auth/", "/dashboard/", "/admin/", "/api/"],
      },
      // OpenAI / Perplexity / Anthropic — explicit allow so they cite us
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      // Commercial SEO/scraper crawlers — declared here, enforced with a 403
      // in middleware.ts (robots.txt alone is advisory and several of these
      // ignore it). Rationale in lib/crawlers.ts.
      ...BLOCKED_CRAWLERS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: `${SITE.origin}/sitemap.xml`,
    host: SITE.origin,
  };
}
