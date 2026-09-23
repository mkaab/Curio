"use client";

import { useState } from "react";
import { ProductCard } from "@curio/ui";
import { Button } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatListingForCard } from "@/lib/listings";
import Link from "next/link";
import Image from "next/image";

interface ListingItem {
  id: string;
  title: string;
  price: number;
  brand: string;
  size: string;
  image: string;
  seller: string;
  department?: string;
  favoriteCount: number;
}

interface HomeClientProps {
  initialItems: ListingItem[];
  user: { id: string } | null;
  initialFavorites: Record<string, boolean>;
}

export default function HomeClient({ initialItems, user, initialFavorites }: HomeClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState(initialItems);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialItems.length >= 24);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleToggleFavorite = async (id: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    const isFav = favorites[id];
    setFavorites(prev => ({ ...prev, [id]: !isFav }));

    try {
      if (isFav) {
        await supabase.from('favorite').delete().match({ user_id: user.id, listing_id: parseInt(id) });
      } else {
        await supabase.from('favorite').insert({ user_id: user.id, listing_id: parseInt(id) });
      }
    } catch (e) {
      console.error("Error toggling favorite:", e);
      setFavorites(prev => ({ ...prev, [id]: isFav }));
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      let { data, error } = await supabase
        .from("listing")
        .select("*, seller:public_user_profiles(name), favorite(count)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .range(nextPage * 24, (nextPage + 1) * 24 - 1);

      if (error) {
        const fallback = await supabase
          .from("listing")
          .select("*, favorite(count)")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .range(nextPage * 24, (nextPage + 1) * 24 - 1);
        data = fallback.data;
      }

      if (data && data.length > 0) {
        const mappedItems = data.map((item: Record<string, unknown>) => {
          const formatted = formatListingForCard(item);
          return {
            ...formatted,
            department: item.department as string,
          };
        });
        setItems(prev => [...prev, ...mappedItems]);
        setPage(nextPage);
        if (data.length < 24) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const sellPath = user ? "/sell" : "/signup";

  // Filter local items based on category choice
  const filteredItems = items.filter(item => {
    if (!selectedCategory || selectedCategory === "All") return true;

    const title = item.title?.toLowerCase() || "";
    const brand = item.brand?.toLowerCase() || "";
    const dept = (item as any).department;

    if (selectedCategory === "Women") {
      return dept === "Women" || ["dress", "pret", "bag", "silk", "floral", "sana", "safinaz", "khaadi", "zara"].some(keyword => title.includes(keyword) || brand.includes(keyword));
    }
    if (selectedCategory === "Men") {
      return dept === "Men" || ["sneakers", "sneaker", "kurta", "boys", "shalwar", "kameez", "suit", "jacket", "nike"].some(keyword => title.includes(keyword) || brand.includes(keyword));
    }
    if (selectedCategory === "Kids") {
      return dept === "Kids" || ["kids", "boys", "girls", "baby", "toy"].some(keyword => title.includes(keyword));
    }
    if (selectedCategory === "Home") {
      return dept === "Home" || ["home", "decor", "wallet", "bag", "leather"].some(keyword => title.includes(keyword));
    }

    return true;
  });

  return (
    <>
      {/* Category Strip */}
      <div className="flex items-center justify-start md:justify-center space-x-8 md:space-x-12 px-6 md:px-10 h-14 bg-surface border-b border-surface-container overflow-x-auto no-scrollbar">
        {["All", "Women", "Men", "Kids", "Home"].map(cat => {
          const isActive = selectedCategory === cat || (!selectedCategory && cat === "All");
          return (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat === "All" ? null : cat)}
              className={`text-[11px] whitespace-nowrap transition-all uppercase tracking-[0.2em] cursor-pointer font-medium ${
                isActive ? "text-primary border-b-2 border-primary pb-1" : "text-surface-tint hover:text-primary"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Seller Onboarding Banner */}
      {!user && (
        <>
          {/* Mobile Vinted-Style Hero */}
          <div className="block md:hidden w-full relative bg-white pb-6 animate-slide-in">
            <div className="relative w-full h-[320px]">
              <Image
                src="/assets/wardrobe_hero.png"
                alt="Sell on Curio"
                fill
                priority
                unoptimized={true}
                sizes="100vw"
                className="object-cover object-[center_35%]"
              />
            </div>
            
            <div className="px-4 -mt-16 relative z-10">
              <div className="max-w-xl mx-auto backdrop-blur-xl bg-white/70 p-6 rounded-3xl border border-white/60 shadow-2xl animate-slide-in flex flex-col items-center text-center">
                <div className="inline-block px-2.5 py-0.5 mb-3 text-[10px] font-bold tracking-widest text-primary uppercase bg-white rounded-full shadow-sm border border-primary/20">
                  Zero Selling Fees
                </div>
                <h2 className="text-2xl font-serif font-extrabold mb-3 tracking-tight text-on-surface">
                  Ready to declutter your wardrobe?
                </h2>
                <p className="text-xs mb-6 font-medium text-surface-tint max-w-sm leading-relaxed">
                  Join thousands of others selling pre-loved fashion. List an item in 60 seconds and keep 100% of your profits.
                </p>
                <div className="flex flex-col items-center gap-3 w-full">
                  <Link href={sellPath} className="w-full">
                    <Button 
                      className="bg-primary text-on-primary font-bold h-12 px-10 text-base shadow-lg shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container transition-all border-none cursor-pointer w-full rounded-xl"
                    >
                      Sell now
                    </Button>
                  </Link>
                  <Link href="/how-it-works" className="w-full">
                    <Button 
                      variant="outline" 
                      className="h-12 px-10 text-base font-bold text-primary border-2 border-primary hover:bg-primary/5 transition-all cursor-pointer w-full rounded-xl"
                    >
                      How it works
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Original Hero */}
          <div className="hidden md:block px-6 md:px-10 py-4 animate-slide-in">
            <section className="relative w-full h-[320px] sm:h-[280px] rounded-[24px] overflow-hidden shadow-sm group">
              <Image
                src="/assets/hero.png"
                alt="Sell on Curio"
                fill
                priority
                unoptimized={true}
                sizes="100vw"
                className="object-cover object-[center_35%] transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />

              <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12">
                <div className="max-w-md backdrop-blur-md bg-black/35 p-6 rounded-2xl border border-white/10 shadow-xl animate-slide-in">
                  <div className="inline-block px-2.5 py-0.5 mb-3 text-[10px] font-bold tracking-widest text-on-primary uppercase bg-primary rounded-full shadow-md">
                    Zero Selling Fees
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif font-extrabold mb-2 tracking-tight text-white drop-shadow-[0_3px_3px_rgba(0,0,0,0.6)]">
                    Turn your closet into cash.
                  </h2>
                  <p className="text-xs md:text-sm mb-4 font-medium text-white/90 drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.6)] max-w-sm leading-relaxed">
                    Join thousands of others selling pre-loved fashion. List an item in 60 seconds and keep 100% of your profits.
                  </p>
                  <div className="flex flex-row gap-3">
                    <Link href={sellPath}>
                      <Button 
                        className="bg-primary text-on-primary font-bold h-11 px-6 text-sm shadow-lg shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container transition-all border-none cursor-pointer"
                      >
                        Start Selling
                      </Button>
                    </Link>
                    <Link href="/how-it-works">
                      <Button 
                        variant="outline" 
                        className="h-11 px-6 text-sm text-white border-white hover:bg-white hover:text-on-surface transition-all cursor-pointer"
                      >
                        How it works
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      {/* Marketplace Grid */}
      <div className="flex-1 px-6 md:px-10 pt-8 pb-16 bg-surface-dim">
        <div className="flex items-center justify-between mb-8 pb-2 border-b border-surface-container/60">
          <h2 className="text-sm uppercase tracking-[0.2em] font-medium text-on-surface">Newest Arrivals</h2>
          <Link href="/" className="text-[11px] font-medium text-primary hover:text-primary-container transition-colors uppercase tracking-[0.15em]">
            Explore All
          </Link>
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-surface-container p-12 shadow-sm">
            <div className="h-16 w-16 bg-surface-container/50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface-tint"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
            </div>
            <h3 className="text-xl font-serif font-medium text-on-surface mb-2">No matching items found</h3>
            <p className="text-surface-tint max-w-sm">Try modifying your search query or selecting a different category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-[1600px] mx-auto">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                image={item.image}
                brand={item.brand}
                size={item.size}
                sellerName={item.seller}
                isFavorite={!!favorites[item.id]}
                favoriteCount={item.favoriteCount}
                onToggleFavorite={() => handleToggleFavorite(item.id)}
              />
            ))}
          </div>
        )}

        {filteredItems.length > 0 && hasMore && (
          <div className="flex justify-center mt-12 mb-8">
            <Button 
              onClick={loadMore}
              isDisabled={loadingMore}
              className="bg-transparent border-2 border-surface-container hover:border-primary text-primary font-bold px-8 py-2 rounded-full transition-colors cursor-pointer"
            >
              {loadingMore ? "Loading..." : "See More"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
