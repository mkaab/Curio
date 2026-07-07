"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Tooltip } from "@heroui/react";
import { Header } from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@curio/ui";
import { useRouter } from "next/navigation";

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

  const handleInitiateChat = async (action: 'buy' | 'offer') => {
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
            last_message: action === 'buy' ? "I would like to buy this item." : `I made an offer: Rs ${amount}`,
            last_offer_status: "pending",
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
        type: 'offer',
        text: action === 'buy' ? "I would like to buy this item at full price." : `I am offering Rs ${amount} for this item.`,
        offer_amount: amount,
        offer_status: 'pending',
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

        {/* Left Side: Image Panel with Thumbnails Selection */}
        <div className="w-full md:w-3/5 flex flex-col items-center animate-slide-in">
          <div className="relative w-full aspect-[3/4] flex-1 min-h-[400px] rounded-lg overflow-hidden bg-surface-dim group">
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/90 backdrop-blur-sm text-black opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIdx(prev => (prev === item.parsedImages.length - 1 ? 0 : prev + 1)); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/90 backdrop-blur-sm text-black opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </>
            )}
          </div>
          
          {/* Thumbnails strip selector */}
          {item.parsedImages.length > 1 && (
            <div className="flex items-center justify-center space-x-2.5 mt-4 w-full overflow-x-auto py-1 no-scrollbar">
              {item.parsedImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIdx(idx)}
                  className={`relative h-14 w-11 shrink-0 rounded overflow-hidden border-2 transition-all cursor-pointer ${idx === currentImageIdx ? 'border-primary scale-105 shadow-sm' : 'border-surface-container hover:border-on-surface-variant'}`}
                >
                  <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Minimalist Details Pane */}
        <div className="w-full md:w-2/5 flex flex-col space-y-8 animate-slide-in">
          
          {/* Dynamic Seller Profile Panel */}
          <div className="flex items-center justify-between pb-6 border-b border-surface-container/60">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-lg shrink-0">
                {item.sellerName[0].toUpperCase()}
              </div>
              <div>
                <p className="font-serif font-bold text-primary text-base leading-tight hover:underline cursor-pointer">{item.sellerName}</p>
                <div className="flex items-center text-[10px] text-surface-tint font-bold mt-1 space-x-1">
                  <span className="text-[#eab308]">{'★'.repeat(Math.round(reviewStats.average))}{'☆'.repeat(5 - Math.round(reviewStats.average))}</span>
                  <span className="text-on-surface-variant font-semibold ml-1">({reviewStats.count} reviews)</span>
                  {item.seller?.last_seen && (
                    <>
                      <span className="mx-1">•</span>
                      <span>Active {timeAgo(item.seller.last_seen)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Link href={`/user/${item.seller_id}`}>
              <Button variant="outline" size="sm" className="border border-surface-container hover:border-primary text-primary font-bold h-9 px-4 rounded-full cursor-pointer bg-transparent text-xs">
                View Profile
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            
            {/* Pricing Section */}
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-4xl font-serif font-black text-primary tracking-tight">₨ {item.price.toLocaleString()}</span>
                <div className="text-xs font-semibold text-surface-tint mt-1.5 flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface-tint shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span title="A 5% + Rs 150 fee is applied to cover your purchase up to Rs 100,000 against scams and significantly not as described items." className="cursor-help border-b border-dashed border-surface-tint pb-[1px]">
                    ₨ {(item.price + 150 + Math.round(item.price * 0.05)).toLocaleString()} includes Buyer Protection
                  </span>
                </div>
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

            {/* Integrated Action Buttons */}
            <div className="space-y-3 pt-2 pb-2">
              {showOfferInput ? (
                <div className="flex items-center space-x-2 bg-white border border-surface-container rounded pl-4 pr-1 h-12 overflow-hidden w-full animate-slide-in">
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
                  <Button onClick={() => handleInitiateChat('offer')} isDisabled={isProcessing} className="bg-primary hover:bg-primary-container text-on-primary font-bold h-9 rounded-full px-4 text-xs whitespace-nowrap border-none cursor-pointer">
                    Send Offer
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    onClick={() => handleInitiateChat('buy')} 
                    isDisabled={isProcessing} 
                    className="bg-primary hover:bg-primary-container text-on-primary font-bold h-12 w-full rounded-full text-sm shadow-sm transition-all border-none cursor-pointer"
                  >
                    {isProcessing ? "Loading..." : "Buy Now"}
                  </Button>
                  <Button 
                    onClick={() => setShowOfferInput(true)} 
                    isDisabled={isProcessing} 
                    variant="outline" 
                    className="border border-surface-container hover:border-surface-tint bg-transparent hover:bg-surface-container text-on-surface font-bold h-12 w-full rounded-full text-sm transition-all cursor-pointer"
                  >
                    Make an Offer
                  </Button>
                </>
              )}
            </div>

            <div className="h-px bg-surface-container/60" />

            {/* Vinted Properties Grid Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm pb-3 border-b border-surface-container/40">
                <span className="text-on-surface-variant font-semibold">Title</span>
                <span className="font-serif font-bold text-primary truncate max-w-[200px]">{item.title}</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-3 border-b border-surface-container/40">
                <span className="text-on-surface-variant font-semibold">Brand</span>
                <span className="font-bold text-surface-tint hover:underline cursor-pointer">{item.brand || 'Unbranded'}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-surface-container/40">
                <span className="text-surface-tint font-semibold">Size</span>
                <span className="font-extrabold text-on-surface">{item.size || 'OS'}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-surface-container/40">
                <span className="font-medium text-surface-tint shrink-0 w-24">Condition</span>
                <span title="Item has been used but is well cared for. It may show minor signs of wear like light pilling or fading, but no major flaws." className="font-bold text-on-surface cursor-help border-b border-dashed border-surface-container pb-[1px]">
                  {item.condition}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-surface-container/40">
                <span className="text-surface-tint font-semibold">Shipping</span>
                <span className="font-extrabold text-on-surface">₨ 250</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-surface-tint font-semibold">Location</span>
                <span className="font-extrabold text-on-surface">Pakistan</span>
              </div>
            </div>

            <div className="h-px bg-surface-container/60" />

            {/* Description block */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Description</h3>
              <p className="text-xs text-surface-tint/95 leading-relaxed whitespace-pre-wrap font-medium">{item.description}</p>
            </div>

            <div className="h-px bg-surface-container/60" />

            {/* Compact Buyer Protection Info panel */}
            <div className="bg-primary/[0.02] border border-primary/10 rounded-xl p-4 text-[10px] text-surface-tint/80 leading-relaxed">
              <span className="font-bold text-primary block mb-1">Our Buyer Protection Plan</span>
              Provides safety against fraud, ensuring full refunds if items are damaged, incorrect, or lost in transit.
            </div>

          </div>

        </div>
      </div>

      {/* Similar Items Section */}
      {similarItems.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-20 w-full animate-slide-in">
          <h2 className="text-2xl font-serif font-black text-on-surface mb-6">Similar Products</h2>
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
              className="bg-primary hover:bg-primary-container text-on-primary font-extrabold h-12 flex-1 rounded-xl text-sm shadow-sm transition-all border-none cursor-pointer"
            >
              {isProcessing ? "Loading..." : "Buy Now"}
            </Button>
            <Button 
              onClick={() => setShowOfferInput(true)} 
              isDisabled={isProcessing} 
              variant="outline" 
              className="border-2 border-surface-container hover:border-primary/30 bg-surface hover:bg-surface-container/20 text-on-surface font-extrabold h-12 flex-1 rounded-xl text-sm transition-all cursor-pointer"
            >
              Offer
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
