"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProductCard } from "@curio/ui";
import { Button } from "@heroui/react";
import { Header } from "@/components/Header";
import Image from "next/image";
import Link from "next/link";

type Tab = "listings" | "orders" | "favorites" | "chats" | "settings";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Read ?tab= from URL
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["listings", "orders", "favorites", "chats", "settings"].includes(tab)) {
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

  // Edit Profile State
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

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
      setEditName(pData.name || "");
      setEditBio(pData.bio || "");
      setEditAvatar(pData.avatar_url || pData.avatarUrl || "");

      // Fetch active listings
      const { data: listingsData } = await supabase
        .from("listing")
        .select("*")
        .eq("seller_id", session.user.id)
        .order("created_at", { ascending: false });

      if (listingsData) {
        // Parse images if needed
        const parsedListings = listingsData.map((item: any) => {
          let parsedImages = [];
          if (item.images) {
            if (Array.isArray(item.images)) parsedImages = item.images;
            else if (typeof item.images === "string") {
              try { parsedImages = JSON.parse(item.images); } catch (e) { parsedImages = [item.images]; }
            }
          }
          return { ...item, images: parsedImages.length > 0 ? parsedImages : ["/assets/hero.png"] };
        });
        setListings(parsedListings);
      }

      // Fetch Favorites
      const { data: favData } = await supabase
        .from("favorite")
        .select("listing(*, seller:public_user_profiles(name))")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (favData) {
        const parsedFavs = favData
          .map((f: any) => f.listing)
          .filter(Boolean)
          .map((item: any) => {
            let parsedImages = [];
            if (item.images) {
              if (Array.isArray(item.images)) parsedImages = item.images;
              else if (typeof item.images === "string") {
                try { parsedImages = JSON.parse(item.images); } catch (e) { parsedImages = [item.images]; }
              }
            }
            return {
              id: String(item.id),
              title: item.title,
              price: item.price,
              brand: item.brand || "Unbranded",
              size: item.size || "OS",
              image: parsedImages.length > 0 ? parsedImages[0] : "/assets/hero.png",
              seller: item.seller?.name || "Curio Member",
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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      await supabase.from("user").update({
        name: editName.trim(),
        bio: editBio.trim(),
        avatar_url: editAvatar,
      }).eq("id", session.user.id);
      setSaveMessage("Profile updated successfully!");
      setProfile((prev: any) => ({ ...prev, name: editName, bio: editBio, avatar_url: editAvatar }));
    } catch (e) {
      setSaveMessage("Error saving profile.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const handleSimulateAvatarUpload = () => {
    const avatars = ["/assets/hero.png", "/assets/luxury.png", "/assets/streetwear.png"];
    setEditAvatar(avatars[Math.floor(Math.random() * avatars.length)]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-warm">
        <div className="h-10 w-10 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "listings", label: "My Listings" },
    { id: "orders", label: "Orders" },
    { id: "favorites", label: "Favorites" },
    { id: "chats", label: "Chats" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <main className="min-h-screen bg-neutral-warm font-sans pb-24 md:pb-12">
      <Header showSearch={false} />
      {/* Top Header */}
      <div className="bg-white border-b border-ceramic">
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-6 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full bg-brand-green text-white flex items-center justify-center text-2xl font-bold shadow-inner overflow-hidden">
              {profile?.avatar_url || profile?.avatarUrl ? (
                <Image src={profile.avatar_url || profile.avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                profile?.name?.[0]?.toUpperCase() || "C"
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-black tracking-tight">{profile?.name || "Curio User"}</h1>
              <p className="text-text-black-soft text-sm mt-1">{profile?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-bold transition-all text-sm ${
                  activeTab === tab.id
                    ? "bg-brand-green text-white shadow-md"
                    : "bg-ceramic/50 text-text-black-soft hover:bg-ceramic hover:text-text-black"
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
              <h2 className="text-2xl font-bold text-text-black">My Listings</h2>
              <Link href="/sell">
                <Button variant="outline" size="sm" className="border-2 font-bold">Add New</Button>
              </Link>
            </div>
            
            {listings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-ceramic p-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-ceramic/50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-black-soft"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
                </div>
                <h3 className="text-xl font-bold text-text-black mb-2">No listings yet</h3>
                <p className="text-text-black-soft mb-6 max-w-sm">Start selling your preloved items to clear out your closet and earn money.</p>
                <Link href="/sell">
                  <Button variant="primary" className="font-bold shadow-lg shadow-brand-green/20">Sell an Item</Button>
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
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="animate-slide-in">
            <h2 className="text-2xl font-bold text-text-black mb-6">My Orders</h2>
            {ordersList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-ceramic p-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-ceramic/50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-black-soft"><path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8.5"/><path d="M21 5.5v5l-9 4-9-4v-5"/><path d="m3 5.5 9-4 9 4"/></svg>
                </div>
                <h3 className="text-xl font-bold text-text-black mb-2">No orders yet</h3>
                <p className="text-text-black-soft max-w-sm">When you buy or sell items, your orders will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {ordersList.map(order => {
                  const isSeller = session.user.id === order.seller_id;
                  const otherName = isSeller ? order.buyer?.name : order.seller?.name;
                  const images = order.listing?.images;
                  const parsedImage = images ? (typeof images === 'string' ? JSON.parse(images)[0] : images[0]) : "/assets/hero.png";
                  
                  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                    pending: { label: "Awaiting Shipment", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
                    shipped: { label: "Shipped", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
                    delivered: { label: "Delivered", color: "text-brand-green", bg: "bg-brand-green/5 border-brand-green/20" },
                    completed: { label: "Completed", color: "text-brand-green", bg: "bg-brand-green/10 border-brand-green/20" },
                  };
                  const sc = statusConfig[order.status] || statusConfig.pending;

                  return (
                    <div key={order.id} className="bg-white border border-ceramic rounded-2xl overflow-hidden">
                      {/* Order Header */}
                      <div className="flex items-center p-4 gap-4">
                        <div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0 border border-ceramic bg-ceramic/50">
                          <Image src={parsedImage || "/assets/hero.png"} alt="Item" fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-text-black truncate text-sm">{order.listing?.title}</h3>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${sc.bg} ${sc.color}`}>
                              {sc.label}
                            </span>
                          </div>
                          <p className="text-lg font-extrabold text-brand-green">Rs {order.agreed_amount?.toLocaleString()}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isSeller ? 'bg-orange-100 text-orange-700' : 'bg-brand-green/10 text-brand-green'}`}>
                              {isSeller ? "Selling" : "Buying"}
                            </span>
                            <span className="text-xs text-text-black-soft">{isSeller ? "to" : "from"} <strong>{otherName || "Curio Member"}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Action Area */}
                      {order.status === 'pending' && isSeller && (
                        <div className="border-t border-ceramic p-4 bg-amber-50/50">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-black">Get ready to ship!</p>
                              <p className="text-xs text-text-black-soft">Package and ship within 2 business days</p>
                            </div>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full h-10 font-bold text-sm"
                            onClick={async () => {
                              const trackingId = prompt("Enter shipping tracking ID (or leave blank):");
                              await supabase.from("transaction").update({
                                status: 'shipped',
                                shipping_tracking_id: trackingId || null
                              }).eq("id", order.id);
                              setOrdersList(prev => prev.map(o => o.id === order.id ? { ...o, status: 'shipped', shipping_tracking_id: trackingId } : o));
                            }}
                          >
                            Mark as Shipped
                          </Button>
                        </div>
                      )}

                      {order.status === 'pending' && !isSeller && (
                        <div className="border-t border-ceramic p-4 bg-amber-50/50">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-black">Waiting for seller to ship</p>
                              <p className="text-xs text-text-black-soft">Seller will ship within 2 business days</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {order.status === 'shipped' && !isSeller && (
                        <div className="border-t border-ceramic p-4 bg-blue-50/50">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700"><rect width="16" height="13" x="6" y="4" rx="2"/><path d="m22 7-7.1 3.78"/><path d="M2 8v11a2 2 0 0 0 2 2h14"/></svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-black">Your item is on the way!</p>
                              {order.shipping_tracking_id && (
                                <p className="text-xs text-text-black-soft">Tracking: <strong className="text-text-black">{order.shipping_tracking_id}</strong></p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full h-10 font-bold text-sm"
                            onClick={async () => {
                              await supabase.from("transaction").update({ status: 'delivered', delivery_confirmed_at: new Date().toISOString() }).eq("id", order.id);
                              setOrdersList(prev => prev.map(o => o.id === order.id ? { ...o, status: 'delivered' } : o));
                            }}
                          >
                            Confirm Delivery
                          </Button>
                        </div>
                      )}

                      {order.status === 'shipped' && isSeller && (
                        <div className="border-t border-ceramic p-4 bg-blue-50/50">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700"><rect width="16" height="13" x="6" y="4" rx="2"/><path d="m22 7-7.1 3.78"/><path d="M2 8v11a2 2 0 0 0 2 2h14"/></svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-black">Item shipped — waiting for delivery confirmation</p>
                              {order.shipping_tracking_id && (
                                <p className="text-xs text-text-black-soft">Tracking: <strong className="text-text-black">{order.shipping_tracking_id}</strong></p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {(order.status === 'delivered' || order.status === 'completed') && (
                        <div className="border-t border-ceramic p-4 bg-brand-green/5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            </div>
                            <p className="text-sm font-bold text-brand-green">Order complete — item delivered!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FAVORITES TAB */}
        {activeTab === "favorites" && (
          <div className="animate-slide-in">
            <h2 className="text-2xl font-bold text-text-black mb-6">My Favorites</h2>
            {favoritesList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-ceramic p-12 flex flex-col items-center justify-center text-center">
                 <div className="h-16 w-16 bg-ceramic/50 rounded-full flex items-center justify-center mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-black-soft"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                 </div>
                 <h3 className="text-xl font-bold text-text-black mb-2">Your favorites list is empty</h3>
                 <p className="text-text-black-soft mb-6 max-w-sm">Heart items you like while browsing to save them here for later.</p>
                 <Link href="/">
                   <Button variant="primary" className="font-bold shadow-lg shadow-brand-green/20">Explore Items</Button>
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
             <h2 className="text-2xl font-bold text-text-black mb-6">My Chats</h2>
             {conversationsList.length === 0 ? (
               <div className="bg-white rounded-3xl border border-ceramic p-12 flex flex-col items-center justify-center text-center">
                 <div className="h-16 w-16 bg-ceramic/50 rounded-full flex items-center justify-center mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-black-soft"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                 </div>
                 <h3 className="text-xl font-bold text-text-black mb-2">No messages yet</h3>
                 <p className="text-text-black-soft max-w-sm">Conversations with buyers and sellers will appear here.</p>
               </div>
             ) : (
               <div className="flex flex-col space-y-3">
                 {conversationsList.map(conv => {
                   const isBuyer = session.user.id === conv.buyer_id;
                   const otherName = isBuyer ? conv.seller?.name : conv.buyer?.name;
                   const roleTag = isBuyer ? "Buying" : "Selling";
                   const images = conv.listing?.images;
                   const parsedImage = images ? (typeof images === 'string' ? JSON.parse(images)[0] : images[0]) : "/assets/hero.png";
                   
                   return (
                     <Link key={conv.id} href={`/chat/${conv.id}`} className="bg-white border border-ceramic rounded-2xl p-4 flex items-center hover:shadow-md transition-shadow group cursor-pointer">
                       <div className="relative h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-ceramic bg-ceramic/50 mr-4">
                         <Image src={parsedImage || "/assets/hero.png"} alt="Listing" fill className="object-cover" />
                       </div>
                       
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-1">
                           <h3 className="font-bold text-text-black truncate text-sm">{conv.listing?.title}</h3>
                           <span className="text-[10px] font-bold text-text-black-soft ml-2 shrink-0">
                             {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ''}
                           </span>
                         </div>
                         <div className="flex items-center space-x-2">
                           <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isBuyer ? 'bg-brand-green/10 text-brand-green' : 'bg-orange-100 text-orange-700'}`}>
                             {roleTag}
                           </span>
                           <span className="text-xs font-bold text-text-black-soft truncate">
                             {otherName || "Curio Member"}
                           </span>
                         </div>
                         <p className="text-sm text-text-black-soft truncate mt-1.5 font-medium group-hover:text-text-black transition-colors">
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

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="max-w-2xl animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-black">Account Settings</h2>
              {saveMessage && <span className="text-brand-green font-bold text-sm bg-brand-green/10 px-3 py-1 rounded-full">{saveMessage}</span>}
            </div>
            
            <div className="bg-white rounded-3xl border border-ceramic p-6 space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative h-20 w-20 rounded-full bg-ceramic/50 border border-ceramic flex items-center justify-center overflow-hidden">
                  {editAvatar ? (
                    <Image src={editAvatar} alt="Profile" fill className="object-cover" />
                  ) : (
                    <span className="text-2xl text-text-black-soft font-bold">{editName?.[0]?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <Button variant="outline" size="sm" onClick={handleSimulateAvatarUpload} className="mb-2 font-bold text-sm border-2">Change Picture</Button>
                  <p className="text-xs text-text-black-soft">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="h-px w-full bg-ceramic/50" />

              <div>
                <label className="block text-sm font-bold text-text-black mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full px-4 py-3 bg-white border-2 border-ceramic rounded-xl focus:outline-none focus:border-brand-green transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-black mb-2">Bio</label>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell buyers a little about your style..."
                  className="w-full px-4 py-3 bg-white border-2 border-ceramic rounded-xl focus:outline-none focus:border-brand-green transition-colors min-h-[100px] resize-y"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-text-black mb-2">Email Address</label>
                <input 
                  type="email" 
                  defaultValue={profile?.email || ""}
                  className="w-full px-4 py-3 bg-neutral-warm border border-ceramic rounded-xl focus:outline-none focus:border-brand-green text-text-black-soft"
                  disabled
                />
                <p className="text-xs text-text-black-soft mt-2">Email changes currently require support assistance.</p>
              </div>

              <div className="pt-6 border-t border-ceramic flex items-center justify-between">
                <Button onClick={handleSignOut} variant="outline" className="h-12 font-bold text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                  Sign Out
                </Button>
                <Button onClick={handleSaveProfile} variant="primary" isDisabled={isSaving} className="h-12 font-bold shadow-lg shadow-brand-green/20 px-8">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav padding for mobile */}
      <div className="fixed bottom-0 w-full h-16 bg-white border-t border-ceramic flex items-center justify-around md:hidden z-40 pb-safe">
        <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-text-black-soft hover:text-brand-green">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </Link>
        <Link href="/sell" className="flex flex-col items-center justify-center w-full h-full text-text-black-soft hover:text-brand-green">
          <div className="bg-brand-green text-white rounded-full p-2 shadow-lg -mt-4 border-4 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </div>
        </Link>
        <div className="flex flex-col items-center justify-center w-full h-full text-brand-green">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
      </div>
    </main>
  );
}
