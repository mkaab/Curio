import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatListingForCard } from "@/lib/listings";
import HomeClient from "./HomeClient";

const PAGE_SIZE = 12;

function HomeFeedSkeleton() {
  return (
    <>
      <div className="flex items-center justify-start md:justify-center space-x-8 md:space-x-12 px-6 md:px-10 h-14 bg-surface border-b border-surface-container overflow-x-auto no-scrollbar">
        {["All", "Women", "Men", "Kids", "Home"].map((cat) => (
          <span
            key={cat}
            className="text-[11px] whitespace-nowrap uppercase tracking-[0.2em] font-semibold text-surface-tint"
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="flex-1 px-6 md:px-10 pt-8 pb-16 bg-surface-dim">
        <div className="flex items-center justify-between mb-8 pb-2 border-b border-surface-container/60">
          <h2 className="text-sm uppercase tracking-[0.2em] font-medium text-on-surface">
            Newest Arrivals
          </h2>
          <span className="h-3 w-20 bg-surface-container rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-[1600px] mx-auto">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="aspect-[3/4] w-full rounded-2xl bg-surface-container/70" />
              <div className="h-3.5 w-3/4 rounded bg-surface-container/70" />
              <div className="h-3 w-1/2 rounded bg-surface-container/50" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

async function HomeFeed() {
  const supabase = await createClient();

  // Fetch user session and initial listings in parallel (no cache — always fresh)
  const [{ data: { user } }, primaryRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("listing")
      .select("id, title, price, brand, size, images, status, condition, department, created_at, seller:public_user_profiles(name), favorite(count)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE),
  ]);

  let rows: Record<string, unknown>[] = (primaryRes.data as unknown as Record<string, unknown>[]) || [];

  if (primaryRes.error) {
    const fallback = await supabase
      .from("listing")
      .select("id, title, price, brand, size, images, status, condition, department, created_at, favorite(count)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    rows = (fallback.data as unknown as Record<string, unknown>[]) || [];
  }

  const initialItems = rows.map((item) => {
    const { images: _dropFullImages, ...card } = formatListingForCard(item);
    return {
      ...card,
      department: item.department as string,
    };
  });

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
    <HomeClient
      initialItems={initialItems}
      user={user ? { id: user.id } : null}
      initialFavorites={initialFavorites}
    />
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col selection:bg-primary selection:text-on-primary bg-surface">
      <Header />
      <Suspense fallback={<HomeFeedSkeleton />}>
        <HomeFeed />
      </Suspense>
      <Footer />
    </main>
  );
}
