import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatListingForCard } from "@/lib/listings";
import HomeClient from "./HomeClient";

export default async function Home() {
  const supabase = await createClient();

  // Fetch user session server-side
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch initial listings server-side (SEO + instant render)
  let { data, error } = await supabase
    .from("listing")
    .select("*, seller:public_user_profiles(name), favorite(count)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    // Fallback to simpler select if custom foreign key fails
    const fallback = await supabase
      .from("listing")
      .select("*, favorite(count)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(24);
    data = fallback.data;
  }

  const initialItems = (data || []).map((item: Record<string, unknown>) => ({
    ...formatListingForCard(item),
    department: item.department as string,
  }));

  // Fetch user favorites server-side
  let initialFavorites: Record<string, boolean> = {};
  if (user) {
    const { data: favData } = await supabase
      .from("favorite")
      .select("listing_id")
      .eq("user_id", user.id);

    if (favData) {
      initialFavorites = favData.reduce((acc: Record<string, boolean>, fav: { listing_id: number }) => {
        acc[String(fav.listing_id)] = true;
        return acc;
      }, {});
    }
  }

  return (
    <main className="flex min-h-screen flex-col selection:bg-primary selection:text-on-primary bg-surface">
      <Header />
      <HomeClient
        initialItems={initialItems}
        user={user ? { id: user.id } : null}
        initialFavorites={initialFavorites}
      />
      <Footer />
    </main>
  );
}
