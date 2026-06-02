"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@curio/ui";
import { Header } from "@/components/Header";
import { Button } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  
  // Search and Filtering States
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        
        // Load User Profile
        const { data: prof } = await supabase
          .from("user_profile")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (prof) setProfile(prof);

        // Load Favorites
        const { data: favs } = await supabase
          .from("favorite")
          .select("listing_id")
          .eq("user_id", session.user.id);
        if (favs) {
          const favMap: Record<string, boolean> = {};
          favs.forEach((f: any) => {
            favMap[f.listing_id.toString()] = true;
          });
          setFavorites(favMap);
        }
      }
    }
    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setFavorites({});
        }
      }
    );

    async function fetchListings() {
      try {
        let { data, error } = await supabase
          .from("listing")
          .select("*, seller:user_profile!listing_seller_id_fkey(name)")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) {
          // Fallback to simpler select if custom foreign key fails
          const fallback = await supabase
            .from("listing")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false });
          data = fallback.data;
          error = fallback.error;
        }

        console.log("Supabase Fetch Result:", data?.length, error);

        if (!error && data && data.length > 0) {
          const mappedItems = data.map((item: any) => {
            let parsedImages = [];
            try {
              parsedImages = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
            } catch (err) {
              parsedImages = [item.images];
            }
            return {
              id: item.id.toString(),
              title: item.title,
              price: item.price,
              brand: item.brand || "Unbranded",
              size: item.size || "OS",
              image: parsedImages?.[0] || "/assets/hero.png",
              seller: item.seller?.name || "Curio Member",
              department: item.department
            };
          });
          setItems(mappedItems);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("fetchListings error:", err);
        setItems([]);
      }
    }

    fetchListings();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const sellPath = user ? "/sell" : "/signup";

  // Filter local items based on search and category choice
  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (!selectedCategory || selectedCategory === "All") return true;

    // Direct classification helper for mock filters
    const title = item.title?.toLowerCase() || "";
    const brand = item.brand?.toLowerCase() || "";
    
    if (selectedCategory === "Women") {
      return item.department === "Women" || ["dress", "pret", "bag", "silk", "floral", "sana", "safinaz", "khaadi", "zara"].some(keyword => title.includes(keyword) || brand.includes(keyword));
    }
    if (selectedCategory === "Men") {
      return item.department === "Men" || ["sneakers", "sneaker", "kurta", "boys", "shalwar", "kameez", "suit", "jacket", "nike"].some(keyword => title.includes(keyword) || brand.includes(keyword));
    }
    if (selectedCategory === "Kids") {
      return item.department === "Kids" || ["kids", "boys", "girls", "baby", "toy"].some(keyword => title.includes(keyword));
    }
    if (selectedCategory === "Home") {
      return item.department === "Home" || ["home", "decor", "wallet", "bag", "leather"].some(keyword => title.includes(keyword));
    }

    return true;
  });

  return (
    <main className="flex min-h-screen flex-col selection:bg-accent-green selection:text-white bg-white">
      {/* Search Header */}
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Category Strip */}
      <div className="flex items-center justify-start md:justify-center space-x-8 md:space-x-12 px-6 md:px-10 h-14 bg-white border-b border-ceramic overflow-x-auto no-scrollbar">
        {["All", "Women", "Men", "Kids", "Home"].map(cat => {
          const isActive = selectedCategory === cat || (!selectedCategory && cat === "All");
          return (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat === "All" ? null : cat)}
              className={`text-xs font-bold whitespace-nowrap transition-all uppercase tracking-widest cursor-pointer ${
                isActive ? "text-brand-green border-b-2 border-brand-green pb-1" : "text-text-black-soft hover:text-brand-green"
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
                <div className="inline-block px-2.5 py-0.5 mb-3 text-[10px] font-bold tracking-widest text-brand-green uppercase bg-white rounded-full shadow-sm border border-brand-green/20">
                  Zero Selling Fees
                </div>
                <h2 className="text-2xl font-extrabold mb-3 tracking-tight text-text-black">
                  Ready to declutter your wardrobe?
                </h2>
                <p className="text-xs mb-6 font-medium text-text-black-soft max-w-sm leading-relaxed">
                  Join thousands of others selling pre-loved fashion. List an item in 60 seconds and keep 100% of your profits.
                </p>
                <div className="flex flex-col items-center gap-3 w-full">
                  <Link href={sellPath} className="w-full">
                    <Button 
                      className="bg-brand-green text-white font-bold h-12 px-10 text-base shadow-lg shadow-brand-green/20 hover:bg-accent-green hover:shadow-xl transition-all border-none cursor-pointer w-full rounded-xl"
                    >
                      Sell now
                    </Button>
                  </Link>
                  <Link href="/how-it-works" className="w-full">
                    <Button 
                      variant="outline" 
                      className="h-12 px-10 text-base font-bold text-brand-green border-2 border-brand-green hover:bg-brand-green/5 transition-all cursor-pointer w-full rounded-xl"
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
                  <div className="inline-block px-2.5 py-0.5 mb-3 text-[10px] font-bold tracking-widest text-white uppercase bg-accent-green rounded-full shadow-md">
                    Zero Selling Fees
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight !text-white drop-shadow-[0_3px_3px_rgba(0,0,0,0.6)]">
                    Turn your closet into cash.
                  </h2>
                  <p className="text-xs md:text-sm mb-4 font-medium text-white/90 drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.6)] max-w-sm leading-relaxed">
                    Join thousands of others selling pre-loved fashion. List an item in 60 seconds and keep 100% of your profits.
                  </p>
                  <div className="flex flex-row gap-3">
                    <Link href={sellPath}>
                      <Button 
                        className="bg-brand-green text-white font-bold h-11 px-6 text-sm shadow-lg shadow-brand-green/20 hover:bg-accent-green hover:shadow-xl transition-all border-none cursor-pointer"
                      >
                        Start Selling
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="h-11 px-6 text-sm text-white border-white hover:bg-white hover:text-text-black transition-all cursor-pointer"
                    >
                      How it works
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      {/* Marketplace Grid */}
      <div className="flex-1 px-6 md:px-10 pt-8 pb-16 bg-[#f8f7f5]/40">
        <div className="flex items-center justify-between mb-8 pb-2 border-b border-ceramic/60">
          <h2 className="text-lg font-black text-text-black uppercase tracking-tight">Newest Items</h2>
          <Link href="/" className="text-xs font-bold text-brand-green hover:text-accent-green transition-colors uppercase tracking-wider">
            Explore All
          </Link>
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-ceramic p-12 shadow-sm">
            <div className="h-16 w-16 bg-ceramic/50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-black-soft"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
            </div>
            <h3 className="text-xl font-bold text-text-black mb-2">No matching items found</h3>
            <p className="text-text-black-soft max-w-sm">Try modifying your search query or selecting a different category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
                onToggleFavorite={() => handleToggleFavorite(item.id)}
              />
            ))}
          </div>
        )}
      </div>

    </main>
  );
}
