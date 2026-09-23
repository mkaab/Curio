"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProductCard } from "@curio/ui";
import { Button } from "@heroui/react";
import { Header } from "@/components/Header";
import { WalletTab } from "@/components/WalletTab";
import { OrdersTab } from "@/components/profile/OrdersTab";
import { SettingsTab } from "@/components/profile/SettingsTab";
import { parseListingImages } from "@/lib/listings";
import Image from "next/image";
import Link from "next/link";

type Tab = "listings" | "orders" | "favorites" | "chats" | "wallet" | "settings";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Read ?tab= from URL
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["listings", "orders", "favorites", "chats", "wallet", "settings"].includes(tab)) {
      setActiveTab(tab as Tab);
    }
  }, []);

  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [favoritesList, setFavoritesList] = useState<any[]>([]);
  const [conversationsList, setConversationsList] = useState<any[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setSession(session);

      // Fetch Profile
      const { data: profileData } = await supabase
        .from("user")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      const pData = profileData || { name: session.user.email?.split('@')[0], email: session.user.email };
      setProfile(pData);

      // Fetch active listings
      const { data: listingsData } = await supabase
        .from("listing")
        .select("*, favorite(count)")
        .eq("seller_id", session.user.id)
        .order("created_at", { ascending: false });

      if (listingsData) {
        const parsedListings = listingsData.map((item: any) => {
          const images = parseListingImages(item.images);
          return { 
            ...item, 
            images,
            favoriteCount: item.favorite?.[0]?.count || 0
          };
        });
        setListings(parsedListings);
      }

      // Fetch Favorites
      const { data: favData } = await supabase
        .from("favorite")
        .select("listing(*, seller:public_user_profiles(name), favorite(count))")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (favData) {
        const parsedFavs = favData
          .map((f: any) => f.listing)
          .filter(Boolean)
          .map((item: any) => {
            const images = parseListingImages(item.images);
            return {
              id: String(item.id),
              title: item.title,
              price: item.price,
              brand: item.brand || "Unbranded",
              size: item.size || "OS",
              image: images[0],
              seller: item.seller?.name || "Curio Member",
              favoriteCount: item.favorite?.[0]?.count || 0
            };
          });
        setFavoritesList(parsedFavs);
      }

      // Fetch Conversations
      const { data: convData } = await supabase
        .from("conversation")
        .select("*, listing(title, images), buyer:public_user_profiles!buyer_id(name), seller:public_user_profiles!seller_id(name)")
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .order("last_message_at", { ascending: false });

      if (convData) {
        setConversationsList(convData);
      }

      // Fetch Orders (Transactions)
      const { data: txData } = await supabase
        .from("transaction")
        .select("*, listing(title, images, price), buyer:public_user_profiles!buyer_id(name), seller:public_user_profiles!seller_id(name)")
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false });

      if (txData) {
        setOrdersList(txData);
      }

      setLoading(false);
    }
    loadData();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleToggleFavorite = async (id: string) => {
    if (!session?.user) return;
    try {
      await supabase.from("favorite").delete().match({ user_id: session.user.id, listing_id: parseInt(id) });
      setFavoritesList(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error("Error unfavoriting on profile:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dim">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "listings", label: "My Listings" },
    { id: "orders", label: "Orders" },
    { id: "favorites", label: "Favorites" },
    { id: "chats", label: "Chats" },
    { id: "wallet", label: "Wallet" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <main className="min-h-screen bg-surface font-sans pb-24 md:pb-12">
      <Header showSearch={false} />
      {/* Top Header */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-10 pt-6 md:pt-10 flex flex-col">
          {/* Top Bar Area */}
          <div className="flex flex-wrap gap-4 items-center justify-between pb-8 border-b border-surface-container">
            <div className="flex items-center space-x-6">
              <div className="relative h-24 w-24 rounded-full border-4 border-surface bg-surface-dim shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
                {profile?.image ? (
                  profile.image.startsWith("data:image") ? (
                    <img src={profile.image} alt="Profile" className="object-cover w-full h-full" />
                  ) : (
                    <Image src={profile.image} alt="Profile" fill className="object-cover" />
                  )
                ) : (
                  <span className="text-3xl text-surface-tint font-bold">{profile?.name?.[0]?.toUpperCase() || "U"}</span>
                )}
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-serif font-medium text-primary">{profile?.name || "Curio Member"}</h1>
                  {profile?.is_admin && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded border border-primary/20">Admin</span>
                  )}
                </div>
                <p className="text-sm font-medium text-surface-tint mt-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Verified Member
                </p>
              </div>
            </div>
            
            {profile?.is_admin && (
              <Link href="/admin">
                <Button className="font-bold bg-primary text-on-primary hover:bg-primary-container h-10 px-6 rounded-lg shadow-sm border-none">
                  Admin Dashboard
                </Button>
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-6 overflow-x-auto mt-8 border-b border-surface-container hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap pb-3 border-b-2 transition-all text-[11px] uppercase tracking-[0.15em] cursor-pointer ${
                  activeTab === tab.id
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-surface-container font-normal"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-4 md:px-10 py-8 animate-fade-in">
        {/* LISTINGS TAB */}
        {activeTab === "listings" && (
          <div className="animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-medium text-primary">My Listings</h2>
              <Link href="/sell">
                <Button variant="outline" size="sm" className="border border-surface-container font-bold rounded">Add New</Button>
              </Link>
            </div>
            
            {listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="h-16 w-16 bg-surface-dim rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
                </div>
                <h3 className="text-xl font-serif font-medium text-primary mb-2">No listings yet</h3>
                <p className="text-on-surface-variant mb-6 max-w-sm">Start selling your preloved items to clear out your closet and earn money.</p>
                <Link href="/sell">
                  <Button className="font-bold bg-primary hover:bg-primary-container text-on-primary rounded">Sell an Item</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {listings.map((item) => (
                  <ProductCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    price={item.price}
                    image={item.images[0]}
                    brand={item.brand}
                    favoriteCount={item.favoriteCount}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <OrdersTab
            ordersList={ordersList}
            session={session}
            supabase={supabase}
            setOrdersList={setOrdersList}
          />
        )}

        {/* FAVORITES TAB */}
        {activeTab === "favorites" && (
          <div className="animate-slide-in">
             <h2 className="text-xl font-serif font-medium text-primary mb-6">My Favorites</h2>
            {favoritesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20">
                 <div className="h-16 w-16 bg-surface-dim rounded-full flex items-center justify-center mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                 </div>
                 <h3 className="text-xl font-serif font-medium text-primary mb-2">Your favorites list is empty</h3>
                 <p className="text-on-surface-variant mb-6 max-w-sm">Heart items you like while browsing to save them here for later.</p>
                 <Link href="/">
                   <Button className="font-bold bg-primary hover:bg-primary-container text-on-primary rounded">Explore Items</Button>
                 </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {favoritesList.map((item) => (
                  <ProductCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    price={item.price}
                    image={item.image}
                    brand={item.brand}
                    size={item.size}
                    sellerName={item.seller}
                    isFavorite={true}
                    favoriteCount={item.favoriteCount}
                    onToggleFavorite={() => handleToggleFavorite(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHATS TAB */}
        {activeTab === "chats" && (
          <div className="animate-slide-in">
             <h2 className="text-xl font-serif font-medium text-primary mb-6">My Chats</h2>
             {conversationsList.length === 0 ? (
               <div className="flex flex-col items-center justify-center text-center py-20">
                 <div className="h-16 w-16 bg-surface-dim rounded-full flex items-center justify-center mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                 </div>
                 <h3 className="text-xl font-serif font-medium text-primary mb-2">No messages yet</h3>
                 <p className="text-on-surface-variant max-w-sm">Conversations with buyers and sellers will appear here.</p>
               </div>
             ) : (
               <div className="flex flex-col space-y-3">
                 {conversationsList.map(conv => {
                   const isBuyer = session.user.id === conv.buyer_id;
                   const otherName = isBuyer ? conv.seller?.name : conv.buyer?.name;
                   const roleTag = isBuyer ? "Buying" : "Selling";
                   const images = conv.listing?.images;
                   const parsedImage = parseListingImages(images)[0];
                   
                   return (
                     <Link key={conv.id} href={`/chat/${conv.id}`} className="bg-surface-bright border border-surface-container rounded-lg p-4 flex items-center hover:shadow-md transition-shadow group cursor-pointer">
                       <div className="relative h-14 w-14 rounded overflow-hidden shrink-0 border border-surface-container bg-surface-dim mr-4">
                         <Image src={parsedImage || "/assets/hero.png"} alt="Listing" fill className="object-cover" />
                       </div>
                       
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-on-surface truncate text-sm">{conv.listing?.title}</h3>
                            <span className="text-[10px] font-bold text-surface-tint ml-2 shrink-0">
                              {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isBuyer ? 'bg-primary/10 text-primary' : 'bg-orange-100 text-orange-700'}`}>
                              {roleTag}
                            </span>
                            <span className="text-xs font-bold text-surface-tint truncate">
                              {otherName || "Curio Member"}
                            </span>
                          </div>
                          <p className="text-sm text-surface-tint truncate mt-1.5 font-medium group-hover:text-on-surface transition-colors">
                            {conv.last_message || "No messages yet"}
                          </p>
                        </div>
                     </Link>
                   );
                 })}
               </div>
             )}
          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === "wallet" && (
           <WalletTab userId={session.user.id} />
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <SettingsTab
            profile={profile}
            session={session}
            supabase={supabase}
            setProfile={setProfile}
            onSignOut={handleSignOut}
          />
        )}
      </div>

      {/* Bottom Nav padding for mobile */}
      <div className="fixed bottom-0 w-full h-16 bg-surface border-t border-surface-container flex items-center justify-around md:hidden z-40 pb-safe">
        <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-surface-tint hover:text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </Link>
        <Link href="/sell" className="flex flex-col items-center justify-center w-full h-full text-surface-tint hover:text-primary">
          <div className="bg-primary text-on-primary rounded-full p-2 shadow-lg -mt-4 border-4 border-surface">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </div>
        </Link>
        <div className="flex flex-col items-center justify-center w-full h-full text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
      </div>
    </main>
  );
}
