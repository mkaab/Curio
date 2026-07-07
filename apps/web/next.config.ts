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
    qualities: [25, 50, 75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          missing: [
            {
              type: 'query',
              key: 'dev',
              value: '1',
            },
          ],
          destination: '/waitlist',
        },
      ],
    };
  },
};

export default nextConfig;
