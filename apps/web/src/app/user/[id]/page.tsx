"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProductCard } from "@curio/ui";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const { id } = use(params);

  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleToggleFavorite = async (listingId: string) => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const isFav = favorites[listingId];
    setFavorites(prev => ({ ...prev, [listingId]: !isFav }));

    try {
      if (isFav) {
        await supabase.from('favorite').delete().match({ user_id: currentUser.id, listing_id: parseInt(listingId) });
      } else {
        await supabase.from('favorite').insert({ user_id: currentUser.id, listing_id: parseInt(listingId) });
      }
    } catch (e) {
      console.error("Error toggling favorite:", e);
      setFavorites(prev => ({ ...prev, [listingId]: isFav }));
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        // Load Current User Session for favorites
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUser(session.user);
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

        // Fetch Seller Profile
        const { data: profileData, error: profileError } = await supabase
          .from("public_user_profiles")
          .select("name")
          .eq("id", id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
        }

        const sellerName = profileData?.name || "Curio Member";
        setSellerProfile({
          id,
          name: sellerName,
          // Mocking rating as requested since there is no reviews table yet
          rating: 5.0,
          reviewCount: 141,
        });

        // Fetch Seller's Active Listings
        const { data: listingsData, error: listingsError } = await supabase
          .from("listing")
          .select("*, favorite(count)")
          .eq("seller_id", id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (listingsError) {
          console.error("Error fetching listings:", listingsError);
        }

        if (listingsData) {
          const mappedItems = listingsData.map((item: any) => {
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
              seller: sellerName,
              favoriteCount: item.favorite?.[0]?.count || 0
            };
          });
          setListings(mappedItems);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-10 w-10 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sellerProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
        <p className="text-lg font-bold text-on-surface">User not found.</p>
        <button onClick={() => router.push("/")} className="text-primary underline">Go Home</button>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-white selection:bg-primary selection:text-on-primary">
      <Header />

      <div className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-16 py-12">
        
        {/* Seller Profile Header */}
        <div className="flex flex-col items-center justify-center text-center mb-16 animate-slide-in">
          <div className="h-24 w-24 rounded-full bg-surface-container text-primary flex items-center justify-center font-serif font-bold text-4xl mb-4 border border-surface-container-high shadow-sm">
            {sellerProfile.name[0].toUpperCase()}
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary mb-2">{sellerProfile.name}</h1>
          <div className="flex items-center space-x-1.5 text-sm text-surface-tint font-bold">
            <span className="text-primary">★★★★★</span>
            <span>{sellerProfile.rating.toFixed(1)}</span>
            <span className="text-on-surface-variant font-normal">({sellerProfile.reviewCount} reviews)</span>
          </div>
          <p className="mt-4 text-sm text-on-surface-variant max-w-md">
            A verified Curio member sharing curated pre-loved pieces. 
            Committed to circular fashion.
          </p>
        </div>

        <div className="h-px bg-surface-container/60 mb-10 w-full" />

        {/* Listings Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-serif font-bold text-primary mb-6">
            Wardrobe ({listings.length})
          </h2>
          
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-dim/30 rounded-xl border border-dashed border-surface-container">
              <p className="text-surface-tint font-medium">This seller has no active listings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {listings.map((item) => (
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
                  favoriteCount={item.favoriteCount}
                  onToggleFavorite={() => handleToggleFavorite(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
