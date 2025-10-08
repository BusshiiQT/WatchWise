/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'ivvnnwvbbpnnytvrejzm.supabase.co', // your Supabase storage bucket
      },
    ],
  },
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
