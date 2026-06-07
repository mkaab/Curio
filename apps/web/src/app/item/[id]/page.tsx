"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@heroui/react";
import { Header } from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const { id } = use(params);

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  
  // Negotiation State
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Auth & Favorite State
  const [user, setUser] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);

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
        <p className="text-lg font-bold text-text-black">Item not found.</p>
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
        <div className="w-full md:w-3/5 bg-surface border border-surface-container p-4 rounded-lg shadow-sm flex flex-col items-center animate-slide-in h-fit">
          <div className="relative w-full aspect-[3/4] md:h-[600px] rounded-lg overflow-hidden bg-surface-dim">
            <Image 
              src={item.parsedImages[currentImageIdx]} 
              alt={item.title} 
              fill 
              className="object-cover"
              priority
            />
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

        {/* Right Side: The Unified Vinted Details Pane Card */}
        <div className="w-full md:w-2/5 flex flex-col space-y-4">
          
          <div className="bg-surface-bright border border-surface-container p-8 rounded-lg shadow-sm space-y-6 animate-slide-in">
            
            {/* Pricing Section */}
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-4xl font-serif font-black text-primary tracking-tight">₨ {item.price.toLocaleString()}</span>
                <div className="text-xs font-semibold text-surface-tint mt-1.5 flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface-tint shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>₨ {(item.price + 150 + Math.round(item.price * 0.05)).toLocaleString()} includes Buyer Protection</span>
                </div>
              </div>
              
              {/* Favorites heart button */}
              <button 
                onClick={handleToggleFavorite}
                className="h-10 w-10 flex items-center justify-center rounded border border-surface-container text-on-surface-variant hover:text-primary active:scale-95 transition-all bg-surface-bright cursor-pointer shadow-sm"
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

            <div className="h-px bg-ceramic/60" />

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
              <div className="flex justify-between items-center text-xs pb-2 border-b border-ceramic/40">
                <span className="text-text-black-soft/75 font-semibold">Size</span>
                <span className="font-extrabold text-text-black">{item.size || 'OS'}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-ceramic/40">
                <span className="text-text-black-soft/75 font-semibold">Condition</span>
                <span className="font-extrabold text-text-black capitalize">{item.condition?.replace(/_/g, ' ') || 'New'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-black-soft/75 font-semibold">Location</span>
                <span className="font-extrabold text-text-black">Pakistan</span>
              </div>
            </div>

            <div className="h-px bg-ceramic/60" />

            {/* Description block */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-text-black uppercase tracking-wider">Description</h3>
              <p className="text-xs text-text-black-soft/95 leading-relaxed whitespace-pre-wrap font-medium">{item.description}</p>
            </div>

            <div className="h-px bg-ceramic/60" />

            {/* Compact Buyer Protection Info panel */}
            <div className="bg-brand-green/[0.02] border border-brand-green/10 rounded-xl p-4 text-[10px] text-text-black-soft/80 leading-relaxed">
              <span className="font-bold text-brand-green block mb-1">Our Buyer Protection Plan</span>
              Provides safety against fraud, ensuring full refunds if items are damaged, incorrect, or lost in transit.
            </div>

            {/* Integrated Action Buttons */}
            <div className="space-y-3 pt-4">
              {showOfferInput ? (
                <div className="flex items-center space-x-2 bg-surface-bright border border-surface-container rounded pl-4 pr-1 h-12 overflow-hidden w-full animate-slide-in">
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
                  <Button onClick={() => handleInitiateChat('offer')} isDisabled={isProcessing} className="bg-primary hover:bg-primary-container text-on-primary font-bold h-9 rounded px-4 text-xs whitespace-nowrap border-none cursor-pointer">
                    Send Offer
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    onClick={() => handleInitiateChat('buy')} 
                    isDisabled={isProcessing} 
                    className="bg-primary hover:bg-primary-container text-on-primary font-bold h-12 w-full rounded text-sm shadow-sm transition-all border-none cursor-pointer"
                  >
                    {isProcessing ? "Loading..." : "Buy Now"}
                  </Button>
                  <Button 
                    onClick={() => setShowOfferInput(true)} 
                    isDisabled={isProcessing} 
                    variant="outline" 
                    className="border border-surface-container hover:border-surface-tint bg-surface-bright hover:bg-surface text-on-surface font-bold h-12 w-full rounded text-sm transition-all cursor-pointer"
                  >
                    Make an Offer
                  </Button>
                </>
              )}
            </div>

          </div>

          {/* Dynamic Seller Profile Panel */}
          <div className="bg-surface-bright border border-surface-container p-6 rounded-lg shadow-sm flex items-center justify-between animate-slide-in mt-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-lg shrink-0">
                {item.sellerName[0].toUpperCase()}
              </div>
              <div>
                <p className="font-serif font-bold text-primary text-base leading-tight hover:underline cursor-pointer">{item.sellerName}</p>
                <div className="flex items-center text-[10px] text-tertiary-fixed-dim font-bold mt-1 space-x-1">
                  <span>★★★★★</span>
                  <span className="text-on-surface-variant font-semibold ml-1">(141 reviews)</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border border-surface-container hover:border-primary text-primary font-bold h-9 px-4 rounded cursor-pointer bg-surface-bright text-xs">
              Ask Seller
            </Button>
          </div>

        </div>

      </div>

      {/* Mobile Sticky Bottom Action Bar (Only shows on mobile viewports) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-ceramic p-4 flex items-center space-x-3 z-50 md:hidden shadow-lg animate-slide-in">
        {showOfferInput ? (
          <div className="flex flex-1 items-center space-x-2 bg-white border-2 border-brand-green rounded-xl pl-4 pr-1 h-12 overflow-hidden w-full">
            <span className="font-bold text-text-black text-sm">₨</span>
            <input 
              type="number" 
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="0"
              className="flex-1 w-full outline-none font-bold text-base text-text-black"
              autoFocus
            />
            <Button onClick={() => setShowOfferInput(false)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-text-black-soft hover:bg-ceramic rounded-full">✕</Button>
            <Button onClick={() => handleInitiateChat('offer')} isDisabled={isProcessing} className="bg-brand-green hover:bg-accent-green text-white font-extrabold h-9 rounded-lg px-4 text-xs whitespace-nowrap border-none cursor-pointer">
              Offer
            </Button>
          </div>
        ) : (
          <>
            <Button 
              onClick={() => handleInitiateChat('buy')} 
              isDisabled={isProcessing} 
              className="bg-brand-green hover:bg-accent-green text-white font-extrabold h-12 flex-1 rounded-xl text-sm shadow-sm transition-all border-none cursor-pointer"
            >
              {isProcessing ? "Loading..." : "Buy Now"}
            </Button>
            <Button 
              onClick={() => setShowOfferInput(true)} 
              isDisabled={isProcessing} 
              variant="outline" 
              className="border-2 border-ceramic hover:border-brand-green/30 bg-white hover:bg-neutral-warm/20 text-text-black font-extrabold h-12 flex-1 rounded-xl text-sm transition-all cursor-pointer"
            >
              Offer
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
