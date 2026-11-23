import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://curiopk.com").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/mission`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/shipping-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/returns`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/cancellation`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  try {
    const supabase = await createClient();
    const { data: listings } = await supabase
      .from("listing")
      .select("id, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(500);

    const listingRoutes: MetadataRoute.Sitemap = (listings || []).map((item) => ({
      url: `${baseUrl}/item/${item.id}`,
      lastModified: item.created_at ? new Date(item.created_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...listingRoutes];
  } catch {
    return staticRoutes;
  }
}
