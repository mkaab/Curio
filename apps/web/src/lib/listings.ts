/**
 * Parses listing images from the database format into a clean string array.
 * Handles: JSON arrays, JSON strings, raw strings, and null/undefined.
 */
export function parseListingImages(images: unknown): string[] {
  if (!images) return ["/assets/hero.png"];

  if (Array.isArray(images)) return images.length > 0 ? images : ["/assets/hero.png"];

  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      return [images];
    }
  }

  return ["/assets/hero.png"];
}

/**
 * Formats a listing from raw DB data into a clean display object.
 */
export function formatListingForCard(item: Record<string, unknown>) {
  const images = parseListingImages(item.images);
  const seller = item.seller as { name?: string } | null;
  const favorite = item.favorite as { count?: number }[] | null;

  return {
    id: String(item.id),
    title: item.title as string,
    price: item.price as number,
    brand: (item.brand as string) || "Unbranded",
    size: (item.size as string) || "OS",
    image: images[0],
    images,
    seller: seller?.name || "Curio Member",
    favoriteCount: favorite?.[0]?.count || 0,
    status: item.status as string,
    condition: item.condition as string,
    created_at: item.created_at as string,
  };
}
