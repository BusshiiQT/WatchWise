/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow TMDB posters + Supabase Storage avatars
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        // wildcard so it works for your project ref subdomain
        hostname: '**.supabase.co',
        // limit to public storage paths
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Do NOT set output:'export'
  // Do NOT set basePath unless you intend to serve under a subpath
};

export default nextConfig;
