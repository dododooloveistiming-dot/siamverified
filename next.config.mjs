/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hybrid: directory pages still pre-render (SSG), but /api and /dashboard
  // run on Vercel's serverless runtime so we can do auth + DB for the
  // business dashboard. Static export removed for this reason.
  images: { unoptimized: true },
  trailingSlash: true,
  experimental: { typedRoutes: false },

  // Headers applied by Vercel (the public/_headers + _redirects files are
  // Cloudflare-Pages-only and are INERT on Vercel). Keeps Hobby bandwidth
  // down by letting the CDN cache the big static assets, and re-adds the
  // security headers that the dead _headers file used to provide.
  async headers() {
    const SECURITY = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ];
    return [
      { source: "/:path*", headers: SECURITY },
      // Sitemaps + robots: long shared-CDN cache, regenerated each deploy.
      {
        source: "/sitemap.xml",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/sitemap-:type.xml",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/robots.txt",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" }],
      },
      // Static data JSON (refreshed by the data pipeline on each deploy).
      {
        source: "/data/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=600, s-maxage=86400, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
