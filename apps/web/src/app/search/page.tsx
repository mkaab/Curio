"use client";

import { useState, useEffect, Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@curio/ui";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [items, setItems] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // URL-driven state
  const q = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "All";

  // Filter state
  const [category, setCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState("All");
  const [condition, setCondition] = useState("All");
  const [sortBy, setSortBy] = useState("Curated Picks");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 12;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [q, category, condition, priceRange, sortBy]);

  // Sync category state if URL changes
  useEffect(() => {
    if (initialCategory !== category) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  // Sync category selection to URL
  const handleCategoryChange = (val: string) => {
    setCategory(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val === "All") params.delete("category");
    else params.set("category", val);
    router.push(`/search?${params.toString()}`);
  };

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
    async function loadData() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
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

      try {
        let query = supabase
          .from("listing")
          .select("*, seller:public_user_profiles(name), favorite(count)", { count: 'exact' })
          .eq("status", "active");

        if (q) {
           query = query.or(`title.ilike.%${q}%,brand.ilike.%${q}%,department.ilike.%${q}%`);
        }

        if (category !== "All") {
           query = query.eq("department", category);
        }

        if (condition !== "All") {
           query = query.eq("condition", condition);
        }

        if (priceRange === "Under $50") {
           query = query.lt('price', 5000);
        } else if (priceRange === "$50 - $200") {
           query = query.gte('price', 5000).lte('price', 20000);
        } else if (priceRange === "Over $200") {
           query = query.gt('price', 20000);
        }

        // Apply sort
        if (sortBy === "Newest") {
           query = query.order("created_at", { ascending: false });
        } else if (sortBy === "Price: Low to High") {
           query = query.order("price", { ascending: true });
        } else if (sortBy === "Price: High to Low") {
           query = query.order("price", { ascending: false });
        } else {
           // Curated Picks default
           query = query.order("created_at", { ascending: false });
        }

        // Apply Pagination
        const from = (page - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.range(from, to);

        let { data, count, error } = await query;

        if (error) {
          console.error("Query failed, falling back:", error);
          let fallbackQuery = supabase.from("listing").select("*, favorite(count)", { count: 'exact' }).eq("status", "active");
          if (q) fallbackQuery = fallbackQuery.or(`title.ilike.%${q}%,brand.ilike.%${q}%,department.ilike.%${q}%`);
          if (category !== "All") fallbackQuery = fallbackQuery.eq("department", category);
          if (condition !== "All") fallbackQuery = fallbackQuery.eq("condition", condition);
          
          if (priceRange === "Under $50") fallbackQuery = fallbackQuery.lt('price', 5000);
          else if (priceRange === "$50 - $200") fallbackQuery = fallbackQuery.gte('price', 5000).lte('price', 20000);
          else if (priceRange === "Over $200") fallbackQuery = fallbackQuery.gt('price', 20000);

          if (sortBy === "Newest") fallbackQuery = fallbackQuery.order("created_at", { ascending: false });
          else if (sortBy === "Price: Low to High") fallbackQuery = fallbackQuery.order("price", { ascending: true });
          else if (sortBy === "Price: High to Low") fallbackQuery = fallbackQuery.order("price", { ascending: false });
          else fallbackQuery = fallbackQuery.order("created_at", { ascending: false });

          fallbackQuery = fallbackQuery.range(from, to);
          const fallback = await fallbackQuery;
          data = fallback.data;
          count = fallback.count;
        }

        if (data) {
          setTotalCount(count || 0);
          setTotalPages(Math.max(1, Math.ceil((count || 0) / ITEMS_PER_PAGE)));
          
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
              department: item.department,
              favoriteCount: item.favorite?.[0]?.count || 0
            };
          });
          setItems(mappedItems);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    // We add a tiny debounce to prevent rapid fire queries if URL is changing fast
    const timeoutId = setTimeout(() => {
      loadData();
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [supabase, q, category, condition, priceRange, sortBy, page]);

  return (
    <main className="flex min-h-screen flex-col bg-surface-bright selection:bg-primary selection:text-on-primary">
      <Header initialQuery={q} />

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-16 py-12 md:py-20">
        
        {/* Page Header */}
        <div className="mb-12">
          {q ? (
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">
              Results for "{q}" {category !== "All" && `in ${category}`}
            </h1>
          ) : (
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">
              Browse {category !== "All" ? category : "Curio"}
            </h1>
          )}
          <p className="text-surface-tint text-base md:text-lg max-w-2xl leading-relaxed">
            Discover an archival collection of pre-loved treasures, curated for longevity and character.
          </p>
        </div>

        {/* Top Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-surface-container/60">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <select 
              suppressHydrationWarning
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="bg-transparent border border-surface-container rounded-md px-4 py-2 text-sm font-medium text-primary outline-none focus:border-primary cursor-pointer hover:bg-surface transition-colors"
            >
              <option value="All">All Categories</option>
              <option value="Women">Women</option>
              <option value="Men">Men</option>
              <option value="Kids">Kids</option>
              <option value="Home">Home</option>
            </select>

            <select 
              suppressHydrationWarning
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="bg-transparent border border-surface-container rounded-md px-4 py-2 text-sm font-medium text-primary outline-none focus:border-primary cursor-pointer hover:bg-surface transition-colors"
            >
              <option value="All">Any Price</option>
              <option value="Under $50">Under ₨ 5,000</option>
              <option value="$50 - $200">₨ 5,000 - ₨ 20,000</option>
              <option value="Over $200">Over ₨ 20,000</option>
            </select>

            <select 
              suppressHydrationWarning
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="bg-transparent border border-surface-container rounded-md px-4 py-2 text-sm font-medium text-primary outline-none focus:border-primary cursor-pointer hover:bg-surface transition-colors"
            >
              <option value="All">Any Condition</option>
              <option value="New with tags">New with tags</option>
              <option value="Like new">Like new</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {!loading && (
              <span className="text-xs font-bold text-surface-tint uppercase tracking-wider">
                {totalCount} Artifacts
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-surface-tint uppercase tracking-wider hidden sm:block">Sort By:</span>
              <select 
                suppressHydrationWarning
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-serif font-bold text-base text-primary outline-none cursor-pointer border-none"
              >
                <option value="Curated Picks">Curated Picks</option>
                <option value="Newest">Newest Arrivals</option>
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Price: High to Low">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-surface-tint font-bold">Searching the archive...</p>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-16 w-16 bg-surface-container/50 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-surface-tint"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary mb-3">No artifacts found</h3>
            <p className="text-surface-tint font-medium max-w-sm">
              We couldn't find any pieces matching your current filters. Try exploring different categories.
            </p>
            <button 
              onClick={() => { 
                setCategory("All"); setPriceRange("All"); setCondition("All"); 
                router.push("/search"); 
              }}
              className="mt-8 text-sm font-bold text-primary border-b border-primary pb-0.5 hover:text-primary-container hover:border-primary-container transition-colors uppercase tracking-widest"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
            {items.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                image={item.image}
                size={item.size}
                brand={item.brand}
                sellerName={item.seller}
                isFavorite={!!favorites[item.id]}
                favoriteCount={!!favorites[item.id] ? item.favoriteCount + 1 : item.favoriteCount}
                onToggleFavorite={() => handleToggleFavorite(item.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination UI */}
        {totalPages > 1 && !loading && items.length > 0 && (
          <div className="mt-20 pt-10 border-t border-surface-container/60 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-surface-tint hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Previous
              </button>
              
              <div className="flex items-center gap-1 mx-4">
                <button className="w-8 h-8 rounded-full bg-primary text-white font-medium text-sm flex items-center justify-center">{page}</button>
                <span className="text-surface-tint text-sm ml-2 font-semibold">of {totalPages}</span>
              </div>

              <button 
                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
