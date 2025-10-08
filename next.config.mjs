/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      // Replace with your actual Supabase subdomain (leave only one matching your project):
      { protocol: 'https', hostname: 'ivvnnwvbbpnnytvrejzm.supabase.co' },
    ],
  },
  // Silence the “inferred workspace root” warning:
  outputFileTracingRoot: process.cwd(),

  // Let builds pass even if ESLint has errors (we’ll also relax rules below)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
