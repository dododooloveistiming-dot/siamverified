import type { MetadataRoute } from "next";
import { SITE } from "@/lib/i18n";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Don't waste crawl budget on auth flows / private dashboards
        disallow: ["/auth/", "/dashboard/", "/admin/", "/api/"],
      },
      // Naver's crawler — explicit allow + slow crawl to be polite
      {
        userAgent: "Yeti",
        allow: "/",
        disallow: ["/auth/", "/dashboard/", "/admin/", "/api/"],
        crawlDelay: 1,
      },
      // Baidu — Chinese-language SEO
      {
        userAgent: "Baiduspider",
        allow: "/",
        disallow: ["/auth/", "/dashboard/", "/admin/", "/api/"],
      },
      // OpenAI / Perplexity / Anthropic — explicit allow so they cite us
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    sitemap: `${SITE.origin}/sitemap.xml`,
    host: SITE.origin,
  };
}
