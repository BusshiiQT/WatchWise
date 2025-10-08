/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: 'image.tmdb.org' }] },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // IMPORTANT: Do NOT set `output: 'export'`
  // IMPORTANT: Do NOT set `basePath` unless you intend to serve under a subpath
};
export default nextConfig;
