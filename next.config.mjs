/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for zero-compute Vercel free-tier hosting
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Strict SSG — bail on any dynamic server access
  experimental: { typedRoutes: false },
};

export default nextConfig;
