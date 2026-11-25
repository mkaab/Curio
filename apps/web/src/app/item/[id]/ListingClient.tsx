"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@heroui/react";
import { Header } from "@/components/Header";
import { CurioLoader } from "@/components/CurioLoader";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@curio/ui";
import { useRouter } from "next/navigation";
import { calculatePricing } from "@/lib/pricing";
import { extractListingId } from "@/lib/listings";
import { useTranslation } from "@/lib/i18n/client";

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface ListingDetail {
  id: number | string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  brand?: string;
  size?: string;
  condition?: string;
  color?: string;
  department?: string;
  created_at: string | null;
  parsedImages: string[];
  sellerName: string;
}

interface CardSummary {
  id: number | string;
  title: string;
  price: number;
  brand?: string;
  size?: string;
  condition?: string;
  image: string;
  seller?: { name?: string } | null;
  favoriteCount: number;
}

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useTranslation();
  const { id: rawId } = use(params);
  const id = extractListingId(rawId);

  const [item, setItem] = useState<ListingDetail | null>(null);
  const [sellerItems, setSellerItems] = useState<CardSummary[]>([]);
  const [similarItems, setSimilarItems] = useState<CardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showProtectionModal, setShowProtectionModal] = useState(false);

  const openLightbox = (idx: number) => {
    setCurrentImageIdx(idx);
    setLightboxOpen(true);
  };

  useEffect(() => {
    if (!lightboxOpen && !showProtectionModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
        setShowProtectionModal(false);
      } else if (lightboxOpen && item?.parsedImages?.length) {
        if (e.key === "ArrowRight") setCurrentImageIdx((prev) => (prev + 1) % item.parsedImages.length);
        else if (e.key === "ArrowLeft") setCurrentImageIdx((prev) => (prev === 0 ? item.parsedImages.length - 1 : prev - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, showProtectionModal, item]);
  
  // Negotiation State
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Favorite & Review State
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
        const primaryRes = await supabase
          .from("listing")
          .select("*, seller:public_user_profiles(name)")
          .eq("id", id)
          .single();

        let data = primaryRes.data;
        if (primaryRes.error) {
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
              } catch {
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

          // Unblock main listing UI immediately (1 round trip)
          setLoading(false);

          // Fetch reviews, seller's other items, and similar items in parallel
          const [reviewsRes, otherSellerRes, similarRes] = await Promise.all([
            data.seller_id
              ? supabase.from("review").select("rating").eq("reviewee_id", data.seller_id)
              : Promise.resolve({ data: null }),
            data.seller_id
              ? supabase
                  .from("listing")
                  .select("id, title, price, brand, size, condition, images, favorite(count)")
                  .eq("status", "active")
                  .eq("seller_id", data.seller_id)
                  .neq("id", id)
                  .order("created_at", { ascending: false })
                  .limit(6)
              : Promise.resolve({ data: null }),
            data.department
              ? supabase
                  .from("listing")
                  .select("id, title, price, brand, size, condition, images, seller:public_user_profiles(name), favorite(count)")
                  .eq("status", "active")
                  .eq("department", data.department)
                  .neq("id", id)
                  .order("created_at", { ascending: false })
                  .limit(5)
              : Promise.resolve({ data: null, error: null }),
          ]);

          if (reviewsRes.data && reviewsRes.data.length > 0) {
            const reviewCount = reviewsRes.data.length;
            const averageRating = reviewsRes.data.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0) / reviewCount;
            setReviewStats({ average: averageRating, count: reviewCount });
          }

          if (otherSellerRes.data) {
            const mappedSeller: CardSummary[] = otherSellerRes.data.map((sItem: Record<string, unknown>) => {
              let sParsed: string[] = [];
              try {
                sParsed = typeof sItem.images === "string" ? JSON.parse(sItem.images) : (sItem.images as string[]) || [];
              } catch {
                sParsed = sItem.images ? [String(sItem.images)] : [];
              }
              const fav = sItem.favorite as { count?: number }[] | null;
              return {
                id: sItem.id as number | string,
                title: sItem.title as string,
                price: sItem.price as number,
                brand: sItem.brand as string | undefined,
                size: sItem.size as string | undefined,
                condition: sItem.condition as string | undefined,
                image: sParsed?.[0] || "/assets/hero.png",
                favoriteCount: fav?.[0]?.count || 0,
              };
            });
            setSellerItems(mappedSeller);
          }

          let similarData = similarRes.data;
          if ("error" in similarRes && similarRes.error && data.department) {
            const fallback = await supabase
              .from("listing")
              .select("id, title, price, brand, size, condition, images, favorite(count)")
              .eq("status", "active")
              .eq("department", data.department)
              .neq("id", id)
              .order("created_at", { ascending: false })
              .limit(5);
            similarData = fallback.data;
          }

          if (similarData) {
            const mappedSimilar: CardSummary[] = similarData.map((simItem: Record<string, unknown>) => {
              let simParsed: string[] = [];
              try {
                simParsed = typeof simItem.images === "string" ? JSON.parse(simItem.images) : (simItem.images as string[]) || [];
              } catch {
                simParsed = simItem.images ? [String(simItem.images)] : [];
              }
              const fav = simItem.favorite as { count?: number }[] | null;
              return {
                id: simItem.id as number | string,
                title: simItem.title as string,
                price: simItem.price as number,
                brand: simItem.brand as string | undefined,
                size: simItem.size as string | undefined,
                condition: simItem.condition as string | undefined,
                seller: simItem.seller as { name?: string } | null | undefined,
                image: simParsed?.[0] || "/assets/hero.png",
                favoriteCount: fav?.[0]?.count || 0,
              };
            });
            setSimilarItems(mappedSimilar);
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
    if (!item) return;
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
    return <CurioLoader />;
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
        <p className="text-lg font-bold text-on-surface">{t("listing.notFound")}</p>
        <Button onClick={() => router.push("/")} variant="outline">{t("listing.goBack")}</Button>
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

        {/* Left Side: Image Panel + Member's Other Items */}
        <div className="w-full md:w-3/5 flex flex-col animate-slide-in">
          {/* Desktop Grid Collage */}
          <div className="hidden md:grid grid-cols-3 gap-2 h-[500px]">
            <div className="col-span-2 h-full relative bg-surface-dim rounded-l-lg overflow-hidden cursor-zoom-in" onClick={() => openLightbox(0)}>
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
                <div className="relative bg-surface-dim rounded-tr-lg overflow-hidden cursor-zoom-in" onClick={() => openLightbox(1)}>
                  <Image src={item.parsedImages[1]} alt={item.title} fill className="object-cover hover:scale-[1.02] transition-transform duration-300" />
                </div>
              ) : (
                <div className="relative bg-surface-dim rounded-tr-lg overflow-hidden">
                  <Image src={item.parsedImages[0]} alt={item.title} fill className="object-cover opacity-50 blur-sm" />
                </div>
              )}
              {item.parsedImages[2] ? (
                <div className="relative bg-surface-dim rounded-br-lg overflow-hidden cursor-zoom-in" onClick={() => openLightbox(2)}>
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
          <div
            className="md:hidden relative w-full aspect-[3/4] min-h-[400px] bg-surface-dim group rounded-lg overflow-hidden cursor-zoom-in"
            onClick={() => openLightbox(currentImageIdx)}
          >
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

          {/* Member's Other Items (fills desktop left-column space directly under photos) */}
          {sellerItems.length > 0 && (
            <div className="hidden md:block mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm uppercase tracking-[0.2em] font-medium text-on-surface">
                  {t("listing.moreFrom")} {item.sellerName}
                </h2>
                <Link href={`/user/${item.seller_id}`} className="text-xs font-semibold text-primary hover:underline">
                  {t("listing.viewAll")}
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {sellerItems.map((sItem) => (
                  <ProductCard
                    key={sItem.id}
                    id={sItem.id.toString()}
                    title={sItem.title}
                    price={sItem.price}
                    image={sItem.image}
                    brand={sItem.brand}
                    size={sItem.size}
                    condition={sItem.condition}
                    sellerName={item.sellerName}
                    isFavorite={false}
                    favoriteCount={sItem.favoriteCount}
                    onToggleFavorite={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
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
                <p className="text-xs text-surface-tint mt-1">{t("listing.uploaded")} {timeAgo(item.created_at)}</p>
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
                <span className="text-sm font-semibold ml-1">{t("listing.incl")}</span>
                <div className="relative flex items-center cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-surface-tint group-hover:text-primary transition-colors">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  {/* Custom CSS Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-surface text-on-surface text-xs rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-surface-container pointer-events-none">
                    <span className="font-bold text-primary block mb-1">{t("listing.curioFees")}</span>
                    <span className="text-surface-tint leading-relaxed block">{t("listing.curioFeesTooltip")}</span>
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
                <span className="text-surface-tint col-span-1">{t("listing.brand")}</span>
                <span className="font-medium text-primary col-span-2 cursor-pointer hover:underline">{item.brand || 'Unbranded'}</span>
              </div>
              <div className="grid grid-cols-3 text-sm">
                <span className="text-surface-tint col-span-1">{t("listing.size")}</span>
                <span className="font-medium text-on-surface col-span-2">{item.size || 'OS'}</span>
              </div>
              <div className="grid grid-cols-3 text-sm">
                <span className="text-surface-tint col-span-1">{t("listing.condition")}</span>
                <span className="font-medium text-on-surface col-span-2">{item.condition}</span>
              </div>
              {item.color && (
                <div className="grid grid-cols-3 text-sm">
                  <span className="text-surface-tint col-span-1">{t("listing.color")}</span>
                  <span className="font-medium text-on-surface col-span-2">{item.color}</span>
                </div>
              )}
              <div className="grid grid-cols-3 text-sm">
                <span className="text-surface-tint col-span-1">{t("listing.uploaded")}</span>
                <span className="font-medium text-on-surface col-span-2">{timeAgo(item.created_at)}</span>
              </div>
            </div>

            <div className="h-px bg-surface-container/60 mb-4" />

            <div className="text-sm font-medium text-on-surface mb-6 flex items-center space-x-2">
              {t("listing.freeShipping")}
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
                    {t("listing.send")}
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    onClick={() => handleInitiateChat('buy')} 
                    isDisabled={isProcessing} 
                    className="w-full bg-primary hover:bg-primary-container text-white font-bold h-10 rounded shadow-sm border-none cursor-pointer"
                  >
                    {t("listing.buyNow")}
                  </Button>
                  <Button 
                    onClick={() => setShowOfferInput(true)} 
                    isDisabled={isProcessing} 
                    variant="outline" 
                    className="w-full border border-primary text-primary hover:bg-primary/5 bg-transparent font-bold h-10 rounded cursor-pointer"
                  >
                    {t("listing.makeOffer")}
                  </Button>
                  <Button 
                    onClick={() => handleInitiateChat('message')} 
                    isDisabled={isProcessing} 
                    variant="outline" 
                    className="w-full border border-primary text-primary hover:bg-primary/5 bg-transparent font-bold h-10 rounded cursor-pointer"
                  >
                    {t("listing.messageSeller")}
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
            <h3 className="font-bold text-sm text-on-surface mb-1">{t("listing.shopSafelyTitle")}</h3>
            <p className="text-xs text-surface-tint leading-relaxed">
              {t("listing.shopSafelyDesc")}
              <br/>
              <button
                type="button"
                onClick={() => setShowProtectionModal(true)}
                className="text-primary hover:underline cursor-pointer font-semibold mt-1 inline-block"
              >
                {t("listing.howCovered")}
              </button>
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
                {t("listing.view")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile: Member's Other Items */}
      {sellerItems.length > 0 && (
        <div className="md:hidden max-w-6xl mx-auto px-4 pb-12 w-full animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm uppercase tracking-[0.2em] font-medium text-on-surface">
              {t("listing.moreFrom")} {item.sellerName}
            </h2>
            <Link href={`/user/${item.seller_id}`} className="text-xs font-semibold text-primary hover:underline">
              {t("listing.viewAll")}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {sellerItems.map((sItem) => (
              <ProductCard
                key={sItem.id}
                id={sItem.id.toString()}
                title={sItem.title}
                price={sItem.price}
                image={sItem.image}
                brand={sItem.brand}
                size={sItem.size}
                condition={sItem.condition}
                sellerName={item.sellerName}
                isFavorite={false}
                favoriteCount={sItem.favoriteCount}
                onToggleFavorite={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Similar Items Section */}
      {similarItems.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-20 w-full animate-slide-in">
          <h2 className="text-sm uppercase tracking-[0.2em] font-medium text-on-surface mb-6">{t("listing.similarProducts")}</h2>
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

      {/* Fullscreen Image Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close fullscreen"
            className="absolute top-4 right-4 h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xl font-bold z-20 cursor-pointer"
          >
            ✕
          </button>

          {item.parsedImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIdx((prev) => (prev === 0 ? item.parsedImages.length - 1 : prev - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center z-20 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIdx((prev) => (prev === item.parsedImages.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center z-20 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </>
          )}

          <div className="relative w-full max-w-4xl h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={item.parsedImages[currentImageIdx]}
              alt={item.title}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold">
            {currentImageIdx + 1} / {item.parsedImages.length}
          </div>
        </div>
      )}

      {/* Buyer Protection Modal */}
      {showProtectionModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowProtectionModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 md:p-8 shadow-2xl relative animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowProtectionModal(false)}
              aria-label="Close modal"
              className="absolute top-5 right-5 h-8 w-8 rounded-full flex items-center justify-center text-surface-tint hover:text-on-surface hover:bg-surface-dim transition-colors cursor-pointer font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 className="text-xl font-serif font-semibold text-on-surface">{t("listing.protectionModalTitle")}</h3>
            </div>

            <p className="text-xs text-surface-tint leading-relaxed mb-5">
              {t("listing.protectionModalIntro")}
            </p>

            <div className="space-y-4 mb-6 text-sm">
              <div>
                <p className="font-semibold text-on-surface mb-0.5">{t("listing.refundPolicyTitle")}</p>
                <p className="text-xs text-surface-tint leading-relaxed">
                  {t("listing.refundPolicyDesc")}
                </p>
              </div>
              <div>
                <p className="font-semibold text-on-surface mb-0.5">{t("listing.escrowTitle")}</p>
                <p className="text-xs text-surface-tint leading-relaxed">
                  {t("listing.escrowDesc")}
                </p>
              </div>
              <div>
                <p className="font-semibold text-on-surface mb-0.5">{t("listing.supportTitle")}</p>
                <p className="text-xs text-surface-tint leading-relaxed">
                  {t("listing.supportDescPrefix")}{" "}
                  <Link href="/returns" className="text-primary font-semibold hover:underline">{t("listing.returnsLink")}</Link>{" "}
                  {t("listing.and")}{" "}
                  <Link href="/contact" className="text-primary font-semibold hover:underline">{t("listing.contactLink")}</Link>.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowProtectionModal(false)}
              className="w-full bg-primary hover:bg-primary-container text-white font-bold h-11 rounded-xl border-none cursor-pointer"
            >
              {t("listing.gotIt")}
            </Button>
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
