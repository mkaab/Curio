import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@curio/ui", "@curio/types", "@curio/validators"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/waitlist',
        permanent: false, // Use temporary redirect for now so it doesn't cache globally if you want to switch back
      },
    ];
  },
};

export default nextConfig;
