"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProductCard } from "@curio/ui";
import { Button, Switch } from "@heroui/react";
import { Header } from "@/components/Header";
import { WalletTab } from "@/components/WalletTab";
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

  // Edit Profile State
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [editBankAccountTitle, setEditBankAccountTitle] = useState("");
  const [editBankAccountNumber, setEditBankAccountNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  
  // CNIC Verification State
  const [cnicLoading, setCnicLoading] = useState(false);
  const [cnicError, setCnicError] = useState("");
  const [cnicSuccess, setCnicSuccess] = useState("");

  // Push Notifications State
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    async function checkPush() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setPushEnabled(!!subscription);
        }
      }
    }
    checkPush();
  }, []);

  const handleTogglePush = async (isSelected: boolean) => {
    setPushLoading(true);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert("Push notifications are not supported by your browser.");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        alert("Service worker not found.");
        return;
      }

      if (isSelected) {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert("Permission to show notifications was denied.");
          return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("VAPID public key not found in env.");
          return;
        }
        
        // Convert base64 to Uint8Array for the browser
        const padding = '='.repeat((4 - vapidPublicKey.length % 4) % 4);
        const base64 = (vapidPublicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });

        // Send to backend
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });
        
        if (res.ok) setPushEnabled(true);
      } else {
        // Unsubscribe
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          // Ideally also tell backend to delete, but for now just local is fine
          setPushEnabled(false);
        }
      }
    } catch (e) {
      console.error("Error toggling push:", e);
      alert("Failed to change push notification settings.");
    } finally {
      setPushLoading(false);
    }
  };

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
      setEditAvatar(pData.image || "");
      setEditBankName(pData.bank_name || "");
      setEditBankAccountTitle(pData.bank_account_title || "");
      setEditBankAccountNumber(pData.bank_account_number || "");

      // Fetch active listings
      const { data: listingsData } = await supabase
        .from("listing")
        .select("*, favorite(count)")
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
          return { 
            ...item, 
            images: parsedImages.length > 0 ? parsedImages : ["/assets/hero.png"],
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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const { error } = await supabase
        .from("user")
        .update({
          name: editName,
          bio: editBio,
          image: editAvatar,
          bank_name: editBankName,
          bank_account_title: editBankAccountTitle,
          bank_account_number: editBankAccountNumber,
        })
        .eq("id", session.user.id);
      
      if (error) throw error;

      setSaveMessage("Profile updated successfully!");
      setProfile((prev: any) => ({ ...prev, name: editName, bio: editBio, image: editAvatar }));
      window.dispatchEvent(new Event("profile-updated"));
    } catch (e: any) {
      console.error("Error saving profile:", JSON.stringify(e));
      setSaveMessage("Error saving profile: " + (e.message || JSON.stringify(e) || "Unknown error"));
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 5000);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      alert("File size exceeds 800KB. Please choose a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleCnicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setCnicError("File size exceeds 2MB. Please choose a smaller image.");
      return;
    }

    setCnicLoading(true);
    setCnicError("");
    setCnicSuccess("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const res = await fetch('/api/verify-cnic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          setCnicSuccess(`Verified successfully! CNIC: ${data.cnic}`);
          setProfile((prev: any) => ({ 
            ...prev, 
            cnic_number: data.cnic, 
            verification_status: 'verified' 
          }));
        } else {
          setCnicError(data.error || "Failed to verify CNIC. Please try again with a clearer image.");
        }
      } catch (err) {
        setCnicError("Network error occurred during verification.");
      } finally {
        setCnicLoading(false);
      }
    };
    reader.readAsDataURL(file);
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
                  <h1 className="text-3xl font-serif font-extrabold text-primary">{profile?.name || "Curio Member"}</h1>
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
                className={`whitespace-nowrap pb-3 border-b-2 font-bold transition-all text-sm cursor-pointer ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-surface-container"
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
              <h2 className="text-2xl font-serif font-bold text-primary">My Listings</h2>
              <Link href="/sell">
                <Button variant="outline" size="sm" className="border border-surface-container font-bold rounded">Add New</Button>
              </Link>
            </div>
            
            {listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="h-16 w-16 bg-surface-dim rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-primary mb-2">No listings yet</h3>
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
          <div className="animate-slide-in">
            <h2 className="text-2xl font-serif font-bold text-primary mb-6">My Orders</h2>
            {ordersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="h-16 w-16 bg-surface-dim rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant"><path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8.5"/><path d="M21 5.5v5l-9 4-9-4v-5"/><path d="m3 5.5 9-4 9 4"/></svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-primary mb-2">No orders yet</h3>
                <p className="text-on-surface-variant max-w-sm">When you buy or sell items, your orders will appear here.</p>
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
                    delivered: { label: "Delivered", color: "text-primary", bg: "bg-primary/5 border-primary/20" },
                    completed: { label: "Completed", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
                  };
                  const sc = statusConfig[order.status] || statusConfig.pending;

                  return (
                    <div key={order.id} className="bg-surface-bright border border-surface-container rounded-lg overflow-hidden">
                      {/* Order Header */}
                      <div className="flex items-center p-4 gap-4">
                        <div className="relative h-16 w-16 rounded overflow-hidden shrink-0 border border-surface-container bg-surface-dim">
                          <Image src={parsedImage || "/assets/hero.png"} alt="Item" fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-on-surface truncate text-sm">{order.listing?.title}</h3>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${sc.bg} ${sc.color}`}>
                              {sc.label}
                            </span>
                          </div>
                          <p className="text-lg font-extrabold text-primary">Rs {order.agreed_amount?.toLocaleString()}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isSeller ? 'bg-orange-100 text-orange-700' : 'bg-primary/10 text-primary'}`}>
                              {isSeller ? "Selling" : "Buying"}
                            </span>
                            <span className="text-xs text-surface-tint">{isSeller ? "to" : "from"} <strong>{otherName || "Curio Member"}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Action Area */}
                      {order.status === 'pending' && isSeller && (
                        <div className="border-t border-surface-container p-4 bg-amber-50/50">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-on-surface">Get ready to ship!</p>
                              <p className="text-xs text-surface-tint">Package and ship within 2 business days</p>
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
                        <div className="border-t border-surface-container p-4 bg-amber-50/50">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-on-surface">Waiting for seller to ship</p>
                              <p className="text-xs text-surface-tint">Seller will ship within 2 business days</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {order.status === 'shipped' && !isSeller && (
                        <div className="border-t border-surface-container p-4 bg-blue-50/50">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700"><rect width="16" height="13" x="6" y="4" rx="2"/><path d="m22 7-7.1 3.78"/><path d="M2 8v11a2 2 0 0 0 2 2h14"/></svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-on-surface">Your item is on the way!</p>
                              {order.shipping_tracking_id && (
                                <p className="text-xs text-surface-tint">Tracking: <strong className="text-on-surface">{order.shipping_tracking_id}</strong></p>
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
                        <div className="border-t border-surface-container p-4 bg-blue-50/50">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700"><rect width="16" height="13" x="6" y="4" rx="2"/><path d="m22 7-7.1 3.78"/><path d="M2 8v11a2 2 0 0 0 2 2h14"/></svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-on-surface">Item shipped — waiting for delivery confirmation</p>
                              {order.shipping_tracking_id && (
                                <p className="text-xs text-surface-tint">Tracking: <strong className="text-on-surface">{order.shipping_tracking_id}</strong></p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {(order.status === 'delivered' || order.status === 'completed') && (
                        <div className="border-t border-surface-container p-4 bg-primary/5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            </div>
                            <p className="text-sm font-bold text-primary">Order complete — item delivered!</p>
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
            <h2 className="text-2xl font-serif font-bold text-primary mb-6">My Favorites</h2>
            {favoritesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20">
                 <div className="h-16 w-16 bg-surface-dim rounded-full flex items-center justify-center mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                 </div>
                 <h3 className="text-xl font-serif font-bold text-primary mb-2">Your favorites list is empty</h3>
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
             <h2 className="text-2xl font-serif font-bold text-primary mb-6">My Chats</h2>
             {conversationsList.length === 0 ? (
               <div className="flex flex-col items-center justify-center text-center py-20">
                 <div className="h-16 w-16 bg-surface-dim rounded-full flex items-center justify-center mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                 </div>
                 <h3 className="text-xl font-serif font-bold text-primary mb-2">No messages yet</h3>
                 <p className="text-on-surface-variant max-w-sm">Conversations with buyers and sellers will appear here.</p>
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
          <div className="max-w-2xl animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-primary">Account Settings</h2>
              {saveMessage && <span className="text-primary font-bold text-sm bg-secondary-fixed px-3 py-1 rounded-full">{saveMessage}</span>}
            </div>
            <div className="space-y-8">
              {/* Avatar Upload */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative h-20 w-20 rounded-full bg-surface-container/50 border border-surface-container flex items-center justify-center overflow-hidden">
                  {editAvatar ? (
                    editAvatar.startsWith("data:image") ? (
                      <img src={editAvatar} alt="Profile" className="object-cover w-full h-full" />
                    ) : (
                      <Image src={editAvatar} alt="Profile" fill className="object-cover" />
                    )
                  ) : (
                    <span className="text-2xl text-surface-tint font-bold">{editName?.[0]?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  <label htmlFor="avatar-upload" className="mb-2 font-bold text-sm border-2 border-surface-container rounded-lg px-4 py-2 cursor-pointer hover:bg-surface-bright transition-colors text-on-surface">Change Picture</label>
                  <p className="text-xs text-surface-tint">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="h-px w-full bg-surface-container/50" />

              <div>
                <label className="block text-sm font-bold text-primary mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full px-4 py-3 bg-surface-bright border border-surface-container rounded focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-primary mb-2">Bio</label>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell buyers a little about your style..."
                  className="w-full px-4 py-3 bg-surface-bright border border-surface-container rounded focus:outline-none focus:border-primary transition-colors min-h-[100px] resize-y"
                />
              </div>

              <div className="h-px w-full bg-surface-container/50 my-8" />
              
              <div>
                <h3 className="text-lg font-serif font-bold text-primary mb-4">Bank Details for Payouts</h3>
                <p className="text-xs text-surface-tint mb-4">Enter your bank details to withdraw funds from your Curio wallet.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Bank Name</label>
                    <input 
                      type="text" 
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                      placeholder="e.g. Meezan Bank, HBL"
                      className="w-full px-4 py-3 bg-surface-bright border border-surface-container rounded focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Account Title</label>
                    <input 
                      type="text" 
                      value={editBankAccountTitle}
                      onChange={(e) => setEditBankAccountTitle(e.target.value)}
                      placeholder="e.g. Muhammad Ali"
                      className="w-full px-4 py-3 bg-surface-bright border border-surface-container rounded focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">IBAN or Account Number</label>
                    <input 
                      type="text" 
                      value={editBankAccountNumber}
                      onChange={(e) => setEditBankAccountNumber(e.target.value)}
                      placeholder="PK00 MEEZ 0000 0000 0000 0000"
                      className="w-full px-4 py-3 bg-surface-bright border border-surface-container rounded focus:outline-none focus:border-primary transition-colors text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
              
              <div className="h-px w-full bg-surface-container/50 my-8" />
              
              <div>
                <h3 className="text-lg font-serif font-bold text-primary mb-4">Identity Verification</h3>
                {profile?.verification_status === 'verified' ? (
                  <div className="bg-green-50 border border-green-200 p-4 rounded flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Identity Verified
                      </p>
                      <p className="text-xs text-green-700 mt-1">CNIC: {profile.cnic_number?.replace(/\d(?=\d{4})/g, "*")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-bright border border-surface-container p-4 rounded">
                    <p className="text-sm font-bold text-on-surface mb-2">Verify Your Identity</p>
                    <p className="text-xs text-surface-tint mb-4">Upload a clear photo of your CNIC. We will automatically extract the ID number and verify it instantly. Your image will not be saved.</p>
                    
                    {cnicError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-bold">
                        {cnicError}
                      </div>
                    )}
                    
                    {cnicSuccess && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-xs font-bold">
                        {cnicSuccess}
                      </div>
                    )}

                    <div className="relative border-2 border-dashed border-surface-container rounded-lg p-6 flex flex-col items-center justify-center hover:bg-surface-dim transition-colors">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleCnicUpload}
                        disabled={cnicLoading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      {cnicLoading ? (
                        <div className="flex flex-col items-center">
                          <div className="h-6 w-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2"></div>
                          <span className="text-sm font-bold text-primary">Running AI Verification...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-surface-tint mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                          <span className="text-sm font-bold text-primary">Tap to upload CNIC</span>
                          <span className="text-xs text-surface-tint mt-1">JPEG/PNG under 2MB</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="h-px w-full bg-surface-container/50 my-8" />
              
              <div>
                <label className="block text-sm font-bold text-primary mb-2">Email Address</label>
                <input 
                  type="email" 
                  defaultValue={profile?.email || ""}
                  className="w-full px-4 py-3 bg-surface-dim border border-surface-container rounded focus:outline-none text-on-surface-variant"
                  disabled
                />
                <p className="text-xs text-on-surface-variant mt-2">Email changes currently require support assistance.</p>
              </div>

              <div className="h-px w-full bg-surface-container/50 my-8" />
              
              <div>
                <h3 className="text-lg font-serif font-bold text-primary mb-4">Push Notifications</h3>
                <div className="flex items-center justify-between bg-surface-bright border border-surface-container p-4 rounded">
                  <div>
                    <p className="text-sm font-bold text-on-surface">Enable Mobile & Desktop Push</p>
                    <p className="text-xs text-surface-tint">Get instantly notified about new chats and orders.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={pushEnabled} 
                      onChange={(e) => handleTogglePush(e.target.checked)} 
                      disabled={pushLoading} 
                    />
                    <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-surface-container flex items-center justify-between">
                <Button onClick={handleSignOut} variant="outline" className="h-12 font-bold text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded">
                  Sign Out
                </Button>
                <Button onClick={handleSaveProfile} className="h-12 font-bold bg-primary hover:bg-primary-container text-on-primary px-8 rounded">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
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
