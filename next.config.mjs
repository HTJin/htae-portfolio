/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a second server run against its own build directory instead of
  // fighting the primary one over `.next`. Unset in normal use.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  experimental: {
    scrollRestoration: true,
  },
}

export default nextConfig
