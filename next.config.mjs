/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hybrid: directory pages still pre-render (SSG), but /api and /dashboard
  // run on Vercel's serverless runtime so we can do auth + DB for the
  // business dashboard. Static export removed for this reason.
  images: { unoptimized: true },
  trailingSlash: true,
  experimental: { typedRoutes: false },
};

export default nextConfig;
