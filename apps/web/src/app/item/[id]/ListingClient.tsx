"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Tooltip } from "@heroui/react";
import { Header } from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@curio/ui";
import { useRouter } from "next/navigation";
import { calculatePricing } from "@/lib/pricing";

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const { id } = use(params);

  const [item, setItem] = useState<any>(null);
  const [similarItems, setSimilarItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  
  // Negotiation State
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Auth & Favorite State
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewStats, setReviewStats] = useState({ average: 5, count: 0 });

  const handleToggleFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const nextFav = !isFavorite;
    setIsFavorite(nextFav);

    try {
      if (isFavorite) {
        await supabase
          .from("favorite")
          .delete()
          .match({ user_id: session.user.id, listing_id: parseInt(id) });
      } else {
        await supabase
          .from("favorite")
          .insert({ user_id: session.user.id, listing_id: parseInt(id) });
      }
    } catch (e) {
      console.error("Error toggling favorite on item details:", e);
      setIsFavorite(!nextFav);
    }
  };

  useEffect(() => {
    async function loadUserAndFavorite() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: fav } = await supabase
          .from("favorite")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("listing_id", parseInt(id))
          .maybeSingle();
        if (fav) {
          setIsFavorite(true);
        }
      }
    }

    async function fetchItem() {
      try {
        let { data, error } = await supabase
          .from("listing")
          .select("*, seller:public_user_profiles(name)")
          .eq("id", id)
          .single();

        if (error) {
          const fallback = await supabase
            .from("listing")
            .select("*")
            .eq("id", id)
            .single();
          data = fallback.data;
        }

        if (data) {
          let parsedImages: string[] = [];
          if (data.images) {
            if (Array.isArray(data.images)) {
              parsedImages = data.images;
            } else if (typeof data.images === "string") {
              try {
                parsedImages = JSON.parse(data.images);
              } catch (e) {
                parsedImages = [data.images];
              }
            }
          }

          if (parsedImages.length === 0) {
            parsedImages = ["/assets/hero.png"];
          }

          setItem({
            ...data,
            parsedImages,
            sellerName: data.seller?.name || "Anonymous",
          });
          
          if (data.seller_id) {
            const { data: reviews } = await supabase.from("review").select("rating").eq("reviewee_id", data.seller_id);
            if (reviews && reviews.length > 0) {
              const reviewCount = reviews.length;
              const averageRating = reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / reviewCount;
              setReviewStats({ average: averageRating, count: reviewCount });
            }
          }
          
          // Fetch similar items
          if (data.department) {
            let { data: similarData, error: similarError } = await supabase
              .from("listing")
              .select("*, seller:public_user_profiles(name), favorite(count)")
              .eq("status", "active")
              .eq("department", data.department)
              .neq("id", id)
              .order("created_at", { ascending: false })
              .limit(5);
              
            if (similarError) {
              const fallback = await supabase
                .from("listing")
                .select("*, favorite(count)")
                .eq("status", "active")
                .eq("department", data.department)
                .neq("id", id)
                .order("created_at", { ascending: false })
                .limit(5);
              similarData = fallback.data;
            }
            
            if (similarData) {
              const mappedSimilar = similarData.map((simItem: any) => {
                let simParsed = [];
                try {
                  simParsed = typeof simItem.images === 'string' ? JSON.parse(simItem.images) : simItem.images;
                } catch (e) {
                  simParsed = [simItem.images];
                }
                return {
                  ...simItem,
                  image: simParsed?.[0] || "/assets/hero.png",
                  favoriteCount: simItem.favorite?.[0]?.count || 0
                };
              });
              setSimilarItems(mappedSimilar);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadUserAndFavorite();
    fetchItem();
  }, [id, supabase]);

  const handleInitiateChat = async (action: 'buy' | 'offer' | 'message') => {
    setIsProcessing(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.id === item.seller_id) {
      alert("You cannot buy your own item.");
      setIsProcessing(false);
      return;
    }

    const amount = action === 'buy' ? item.price : Number(offerAmount);
    if (action === 'offer' && (isNaN(amount) || amount <= 0)) {
      alert("Please enter a valid offer amount.");
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Check for existing conversation
      let convId;
      const { data: existingConv } = await supabase
        .from("conversation")
        .select("id")
        .eq("listing_id", id)
        .eq("buyer_id", session.user.id)
        .single();

      if (existingConv) {
        convId = existingConv.id;
      } else {
        // 2. Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from("conversation")
          .insert({
            listing_id: Number(id),
            buyer_id: session.user.id,
            seller_id: item.seller_id,
            last_message: action === 'buy' ? "I would like to buy this item." : action === 'offer' ? `I made an offer: Rs ${amount}` : "Hello, I have a question about this item.",
            last_offer_status: action === 'message' ? null : "pending",
            last_message_at: new Date().toISOString()
          })
          .select("id")
          .single();
          
        if (convError) throw convError;
        convId = newConv.id;
      }

      // 3. Insert the message
      await supabase.from("chat_message").insert({
        conversation_id: convId,
        sender_id: session.user.id,
        type: action === 'message' ? 'text' : 'offer',
        text: action === 'buy' ? "I would like to buy this item at full price." : action === 'offer' ? `I am offering Rs ${amount} for this item.` : "Hello, I have a question about this item.",
        offer_amount: action === 'message' ? null : amount,
        offer_status: action === 'message' ? null : 'pending',
        timestamp: new Date().toISOString()
      });

      // 4. Redirect to chat
      router.push(`/chat/${convId}`);
    } catch (err) {
      console.error("Error initiating chat:", err);
      alert("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-10 w-10 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
        <p className="text-lg font-bold text-on-surface">Item not found.</p>
        <Button onClick={() => router.push("/")} variant="outline">Go Back</Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface pb-24 md:pb-12 font-sans flex flex-col selection:bg-primary selection:text-white">
      <div className="hidden md:block">
        <Header />
      </div>
      
      {/* Mobile Top Nav (Overlay) */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:hidden bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white active:scale-95 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button 
          onClick={handleToggleFavorite}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white active:scale-95 transition-all"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill={isFavorite ? "#006241" : "none"} 
            stroke={isFavorite ? "#006241" : "currentColor"} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 px-4 md:px-8 py-10 md:py-20 w-full flex-1">

        {/* Left Side: Image Panel */}
        <div className="w-full md:w-3/5 flex flex-col animate-slide-in">
          {/* Desktop Grid Collage */}
          <div className="hidden md:grid grid-cols-3 gap-2 h-[500px]">
            <div className="col-span-2 h-full relative bg-surface-dim rounded-l-lg overflow-hidden cursor-pointer" onClick={() => setCurrentImageIdx(0)}>
              <Image 
                src={item.parsedImages[0]} 
                alt={item.title} 
                fill 
                className="object-cover hover:scale-[1.02] transition-transform duration-300"
                priority
              />
            </div>
            <div className="col-span-1 grid grid-rows-2 gap-2 h-full">
              {item.parsedImages[1] ? (
                <div className="relative bg-surface-dim rounded-tr-lg overflow-hidden cursor-pointer" onClick={() => setCurrentImageIdx(1)}>
                  <Image src={item.parsedImages[1]} alt={item.title} fill className="object-cover hover:scale-[1.02] transition-transform duration-300" />
                </div>
              ) : (
                <div className="relative bg-surface-dim rounded-tr-lg overflow-hidden">
                  <Image src={item.parsedImages[0]} alt={item.title} fill className="object-cover opacity-50 blur-sm" />
                </div>
              )}
              {item.parsedImages[2] ? (
                <div className="relative bg-surface-dim rounded-br-lg overflow-hidden cursor-pointer" onClick={() => setCurrentImageIdx(2)}>
                  <Image src={item.parsedImages[2]} alt={item.title} fill className="object-cover hover:scale-[1.02] transition-transform duration-300" />
                  {item.parsedImages.length > 3 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xl">
                      +{item.parsedImages.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative bg-surface-dim rounded-br-lg overflow-hidden">
                  <Image src={item.parsedImages[0]} alt={item.title} fill className="object-cover opacity-50 blur-sm" />
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Image Carousel */}
          <div className="md:hidden relative w-full aspect-[3/4] min-h-[400px] bg-surface-dim group rounded-lg overflow-hidden">
            <Image 
              src={item.parsedImages[currentImageIdx]} 
              alt={item.title} 
              fill 
              className="object-cover"
              priority
            />
            {item.parsedImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIdx(prev => (prev === 0 ? item.parsedImages.length - 1 : prev - 1)); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/90 backdrop-blur-sm text-black transition-all shadow-sm z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIdx(prev => (prev === item.parsedImages.length - 1 ? 0 : prev + 1)); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/90 backdrop-blur-sm text-black transition-all shadow-sm z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Details Pane */}
        <div className="w-full md:w-2/5 flex flex-col animate-slide-in space-y-4">
          
          <div className="bg-white md:border md:border-surface-container md:rounded-lg p-0 md:p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-xl font-semibold text-on-surface mb-1">
                  {item.title}
                </h1>
                <p className="text-sm text-surface-tint">
                  {item.size || "OS"} • {item.condition} • <span className="hover:underline cursor-pointer">{item.brand || "Unbranded"}</span>
                </p>
                <p className="text-xs text-surface-tint mt-1">Uploaded {timeAgo(item.created_at)}</p>
              </div>
              {/* Favorites heart button */}
              <button 
                onClick={handleToggleFavorite}
                className="h-10 w-10 flex items-center justify-center rounded border border-surface-container text-on-surface-variant hover:text-primary active:scale-95 transition-all bg-white cursor-pointer shadow-sm shrink-0 ml-4"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill={isFavorite ? "var(--color-primary)" : "none"} 
                  stroke={isFavorite ? "var(--color-primary)" : "currentColor"} 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              </button>
            </div>
            
            {/* Pricing Section */}
            <div className="mb-6 mt-4">
              <span className="text-sm text-surface-tint block mb-0.5">
                ₨ {item.price.toLocaleString()}
              </span>
              <div className="flex items-center space-x-1 text-primary group relative w-fit">
                <span className="text-[22px] font-bold">
                  ₨ {(item.price + calculatePricing(item.price).buyerProtectionFee).toLocaleString()}
                </span>
                <span className="text-sm font-semibold ml-1">incl.</span>
                <div className="relative flex items-center cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-surface-tint group-hover:text-primary transition-colors">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  {/* Custom CSS Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-surface text-on-surface text-xs rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-surface-container pointer-events-none">
                    <span className="font-bold text-primary block mb-1">Buyer Protection</span>
                    <span className="text-surface-tint leading-relaxed block">A 5% + Rs 150 fee is applied to cover your purchase up to Rs 100,000 against scams and significantly not as described items.</span>
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-surface-container"></div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-[6px] border-transparent border-t-surface"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-surface-container/60 mb-4" />

            {/* Properties Grid */}
            <div className="space-y-2 mb-6">
              <div className="grid grid-cols-3 text-sm">
                <span className="text-surface-tint col-span-1">Brand</span>
                <span className="font-medium text-primary col-span-2 cursor-pointer hover:underline">{item.brand || 'Unbranded'}</span>
              </div>
              <div className="grid grid-cols-3 text-sm">
                <span className="text-surface-tint col-span-1">Size</span>
                <span className="font-medium text-on-surface col-span-2">{item.size || 'OS'}</span>
              </div>
              <div className="grid grid-cols-3 text-sm">
                <span className="text-surface-tint col-span-1">Condition</span>
                <span className="font-medium text-on-surface col-span-2">{item.condition}</span>
              </div>
              <div className="grid grid-cols-3 text-sm">
                <span className="text-surface-tint col-span-1">Color</span>
                <span className="font-medium text-on-surface col-span-2">{item.color || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 text-sm">
                <span className="text-surface-tint col-span-1">Uploaded</span>
                <span className="font-medium text-on-surface col-span-2">{timeAgo(item.created_at)}</span>
              </div>
            </div>

            <div className="h-px bg-surface-container/60 mb-4" />

            <div className="text-sm font-medium text-on-surface mb-6 flex items-center space-x-2">
              Free shipping
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {showOfferInput ? (
                <div className="flex items-center space-x-2 bg-white border border-surface-container rounded pl-4 pr-1 h-12 overflow-hidden w-full">
                  <span className="font-bold text-on-surface text-sm">₨</span>
                  <input 
                    type="number" 
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="0"
                    className="flex-1 w-full outline-none font-bold text-base text-on-surface bg-transparent"
                    autoFocus
                  />
                  <Button onClick={() => setShowOfferInput(false)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-on-surface-variant hover:bg-surface-container rounded-full">✕</Button>
                  <Button onClick={() => handleInitiateChat('offer')} isDisabled={isProcessing} className="bg-primary hover:bg-primary-container text-white font-bold h-9 rounded px-4 text-xs whitespace-nowrap border-none cursor-pointer">
                    Send
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    onClick={() => handleInitiateChat('buy')} 
                    isDisabled={isProcessing} 
                    className="w-full bg-primary hover:bg-primary-container text-white font-bold h-10 rounded shadow-sm border-none cursor-pointer"
                  >
                    Buy now
                  </Button>
                  <Button 
                    onClick={() => setShowOfferInput(true)} 
                    isDisabled={isProcessing} 
                    variant="outline" 
                    className="w-full border border-primary text-primary hover:bg-primary/5 bg-transparent font-bold h-10 rounded cursor-pointer"
                  >
                    Make an offer
                  </Button>
                  <Button 
                    onClick={() => handleInitiateChat('message')} 
                    isDisabled={isProcessing} 
                    variant="outline" 
                    className="w-full border border-primary text-primary hover:bg-primary/5 bg-transparent font-bold h-10 rounded cursor-pointer"
                  >
                    Message seller
                  </Button>
                </>
              )}
            </div>

            <div className="h-px bg-surface-container/60 my-6" />

            {/* Description block */}
            <div className="space-y-2">
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          </div>
          
          {/* Shop and sell safely banner */}
          <div className="bg-white md:border md:border-surface-container md:rounded-lg p-4">
            <h3 className="font-bold text-sm text-on-surface mb-1">Shop and sell safely</h3>
            <p className="text-xs text-surface-tint leading-relaxed">
              Every purchase is covered by our refund policy, secure transactions, and support.
              <br/>
              <span className="text-primary hover:underline cursor-pointer font-semibold mt-1 inline-block">How you're covered</span>
            </p>
          </div>
          
          {/* Seller Profile Panel */}
          <div className="bg-white md:border md:border-surface-container md:rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-base shrink-0">
                {item.sellerName[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-primary text-sm hover:underline cursor-pointer">{item.sellerName}</p>
                <div className="flex items-center text-[10px] text-surface-tint mt-0.5 space-x-1">
                  <span className="text-[#eab308]">{'★'.repeat(Math.round(reviewStats.average))}{'☆'.repeat(5 - Math.round(reviewStats.average))}</span>
                  <span className="text-on-surface-variant font-semibold">({reviewStats.count})</span>
                </div>
              </div>
            </div>
            <Link href={`/user/${item.seller_id}`}>
              <Button variant="outline" size="sm" className="border border-surface-container hover:border-primary text-primary font-bold h-8 px-3 rounded cursor-pointer bg-transparent text-xs">
                View
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Similar Items Section */}
      {similarItems.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-20 w-full animate-slide-in">
          <h2 className="text-sm uppercase tracking-[0.2em] font-medium text-on-surface mb-6">Similar Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {similarItems.map(item => (
              <ProductCard
                key={item.id}
                id={item.id.toString()}
                title={item.title}
                price={item.price}
                image={item.image}
                brand={item.brand}
                size={item.size}
                condition={item.condition}
                sellerName={item.seller?.name || "Curio Member"}
                isFavorite={false}
                favoriteCount={item.favoriteCount}
                onToggleFavorite={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar (Only shows on mobile viewports) */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-surface-container p-4 flex items-center space-x-3 z-50 md:hidden shadow-lg animate-slide-in">
        {showOfferInput ? (
          <div className="flex flex-1 items-center space-x-2 bg-surface border-2 border-primary rounded-xl pl-4 pr-1 h-12 overflow-hidden w-full">
            <span className="font-bold text-on-surface text-sm">₨</span>
            <input 
              type="number" 
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="0"
              className="flex-1 w-full outline-none font-bold text-base text-on-surface"
              autoFocus
            />
            <Button onClick={() => setShowOfferInput(false)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-surface-tint hover:bg-surface-container rounded-full">✕</Button>
            <Button onClick={() => handleInitiateChat('offer')} isDisabled={isProcessing} className="bg-primary hover:bg-primary-container text-on-primary font-extrabold h-9 rounded-lg px-4 text-xs whitespace-nowrap border-none cursor-pointer">
              Offer
            </Button>
          </div>
        ) : (
          <>
            <Button 
              onClick={() => handleInitiateChat('buy')} 
              isDisabled={isProcessing} 
              className="bg-primary hover:bg-primary-container text-white font-bold h-10 flex-1 rounded shadow-sm border-none cursor-pointer"
            >
              Buy
            </Button>
            <Button 
              onClick={() => setShowOfferInput(true)} 
              isDisabled={isProcessing} 
              variant="outline" 
              className="border border-primary text-primary hover:bg-primary/5 bg-transparent font-bold h-10 flex-1 rounded cursor-pointer"
            >
              Offer
            </Button>
            <Button 
              onClick={() => handleInitiateChat('message')} 
              isDisabled={isProcessing} 
              variant="outline" 
              className="border border-primary text-primary hover:bg-primary/5 bg-transparent font-bold h-10 w-10 flex items-center justify-center rounded cursor-pointer shrink-0 px-0"
              aria-label="Message Seller"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
