import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://curiopk.com").replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/auth/", "/chat/", "/profile", "/sell"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
