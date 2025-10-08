/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow TMDb poster/backdrop images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
    ],
    // Or you could use the older `domains` array:
    // domains: ["image.tmdb.org"],
  },
};

export default nextConfig;
