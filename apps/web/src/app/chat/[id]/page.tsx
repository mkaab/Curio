"use client";

import { useEffect, useState, use, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@curio/ui";
import { ShippingModal } from "@/components/ShippingModal";
import { ReviewModal } from "@/components/ReviewModal";
import { DisputeModal } from "@/components/DisputeModal";
import { PaymentModal } from "@/components/PaymentModal";
import { createNotification } from "@/lib/notifications";
import Link from "next/link";
import Image from "next/image";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const { id: conversationId } = use(params);

  const [session, setSession] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  const [counterMessageId, setCounterMessageId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadChat() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setSession(session);

      // Fetch user profile for shipping address
      const { data: profile } = await supabase
        .from("user")
        .select("shipping_address")
        .eq("id", session.user.id)
        .single();
      if (profile) setUserProfile(profile);

      // Fetch Conversation with listing details
      const { data: convData, error: convErr } = await supabase
        .from("conversation")
        .select("*, listing(*)")
        .eq("id", conversationId)
        .single();
        
      if (convErr || !convData) {
        alert("Conversation not found");
        router.push("/profile?tab=chats");
        return;
      }
      setConversation(convData);

      // Fetch Messages
      const { data: msgData } = await supabase
        .from("chat_message")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("timestamp", { ascending: true });
        
      if (msgData) setMessages(msgData);

      // Fetch Transaction
      const { data: txData } = await supabase
        .from("transaction")
        .select("*")
        .eq("conversation_id", conversationId)
        .maybeSingle();
      if (txData) setTransaction(txData);

      setLoading(false);
      scrollToBottom();
    }
    
    loadChat();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('chat_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_message', filter: `conversation_id=eq.${conversationId}` }, (payload: any) => {
        setMessages(prev => [...prev, payload.new]);
        scrollToBottom();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_message', filter: `conversation_id=eq.${conversationId}` }, (payload: any) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transaction', filter: `conversation_id=eq.${conversationId}` }, (payload: any) => {
        setTransaction(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transaction', filter: `conversation_id=eq.${conversationId}` }, (payload: any) => {
        setTransaction(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, router, supabase]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const text = inputText.trim();
    setInputText("");

    await supabase.from("chat_message").insert({
      conversation_id: conversationId,
      sender_id: session.user.id,
      type: "text",
      text: text,
      timestamp: new Date().toISOString()
    });

    await supabase.from("conversation").update({
      last_message: text,
      last_message_at: new Date().toISOString()
    }).eq("id", conversationId);
  };

  const handleUpdateOffer = async (messageId: string, status: 'accepted' | 'declined', amount?: number) => {
    await supabase.from("chat_message").update({ offer_status: status }).eq("id", messageId);
    
    await supabase.from("chat_message").insert({
      conversation_id: conversationId,
      sender_id: session.user.id,
      type: "system",
      text: `Offer was ${status}.`,
      timestamp: new Date().toISOString()
    });
    
    await supabase.from("conversation").update({
      last_offer_status: status,
      last_message: `Offer ${status}`,
      last_message_at: new Date().toISOString()
    }).eq("id", conversationId);

    if (status === 'accepted' && amount !== undefined) {
      const platformFee = Math.round(amount * 0.05);
      const shippingFee = 250;
      const { error: txErr } = await supabase.from("transaction").insert({
        listing_id: conversation.listing_id,
        conversation_id: Number(conversationId),
        buyer_id: conversation.buyer_id,
        seller_id: conversation.seller_id,
        agreed_amount: amount,
        platform_fee: platformFee,
        seller_payout: amount - platformFee + shippingFee,
        shipping_fee: shippingFee,
        status: 'pending',
        payment_gateway: 'cod'
      });
      if (txErr) {
        console.error("Failed to create transaction:", txErr);
        alert("Offer accepted, but failed to create order: " + txErr.message);
      }
    }
  };

  const handlePayCOD = async () => {
    if (!transaction) return;
    setIsProcessingPayment(true);
    await supabase.from("transaction").update({ status: 'placed', payment_gateway: 'cod' }).eq("id", transaction.id);
    await supabase.from("chat_message").insert({
      conversation_id: conversationId,
      sender_id: session.user.id,
      type: "system",
      text: "Buyer selected Cash on Delivery.",
      timestamp: new Date().toISOString()
    });
    setIsProcessingPayment(false);
  };

  const handlePaySwich = async (shippingAddress: any) => {
    if (!transaction || !conversation.listing) return;
    setIsProcessingPayment(true);
    
    try {
      // 1. Save shipping address to user profile
      await supabase.from("user").update({
        shipping_address: shippingAddress
      }).eq("id", session.user.id);

      // 2. Save shipping details to transaction
      await supabase.from("transaction").update({
        shipping_details: shippingAddress
      }).eq("id", transaction.id);

      // 3. Initiate Swich Payment
      const res = await fetch('/api/payment/swich/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerTransactionId: transaction.id.toString(),
          amount: transaction.agreed_amount,
          item: conversation.listing.title,
          payeename: session.user.email?.split('@')[0] || 'User',
          email: session.user.email || 'guest@curio.com',
          msisdn: '03000000000'
        })
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(data.error || 'Failed to initiate payment');
      }
    } catch (err) {
      console.error(err);
      alert('Payment error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const updateTransactionStatus = async (newStatus: string, systemMessage: string) => {
    if (!transaction) return;
    try {
      const { updateTransactionStatusSecure } = await import('@/app/actions/transaction');
      await updateTransactionStatusSecure(transaction.id, newStatus);
      
      await supabase.from("chat_message").insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        type: "system",
        text: systemMessage,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const handleSellerAccept = async () => {
    await updateTransactionStatus('accepted', 'Seller accepted the order.');
    await createNotification(supabase, transaction.buyer_id, 'order_accepted', `Your order for ${conversation?.listing?.title} has been accepted!`, `/chat/${conversationId}`);
  };
  
  const handleSellerShip = async (trackingId: string, courierName: string) => {
    try {
      // Save tracking info to transaction
      await supabase.from("transaction").update({ 
        shipping_tracking_id: `${courierName}: ${trackingId}` 
      }).eq("id", transaction.id);

      await updateTransactionStatus('shipped', `Order has been shipped via ${courierName}. Tracking: ${trackingId}`);
      await createNotification(supabase, transaction.buyer_id, 'order_shipped', `Your order for ${conversation?.listing?.title} has been shipped!`, `/chat/${conversationId}`);
    } catch (err: any) {
      alert("Failed to save shipping info");
    }
  };

  const handleDisputeSubmit = async (reason: string, description: string) => {
    try {
      // Create dispute record
      await supabase.from("dispute").insert({
        transaction_id: transaction.id,
        reporter_id: session.user.id,
        reason: reason,
        description: description,
        status: 'open'
      });

      await updateTransactionStatus('disputed', `Buyer has opened a dispute: ${reason}. Support will review this shortly.`);
      await createNotification(supabase, transaction.seller_id, 'dispute_opened', `A dispute has been opened for ${conversation?.listing?.title}.`, `/chat/${conversationId}`);
    } catch (err: any) {
      alert("Failed to open dispute");
    }
  };

  const handleBuyerReceive = async () => {
    await updateTransactionStatus('received', 'Order was received by the buyer.');
    await createNotification(supabase, transaction.seller_id, 'order_received', `The buyer has received ${conversation?.listing?.title}! Earnings will be transferred.`, `/chat/${conversationId}`);
    
    if (transaction.payment_gateway !== 'cod') {
      try {
        const { creditSellerEarning } = await import('@/app/actions/wallet');
        await creditSellerEarning(transaction.id);
      } catch (err) {
        console.error("Failed to credit seller:", err);
      }
    }
  };

  const handleComplete = () => {
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!transaction) return;
    setIsSubmittingReview(true);
    
    try {
      // 1. Save the review
      const { error: reviewErr } = await supabase.from("review").insert({
        transaction_id: transaction.id,
        reviewer_id: session.user.id,
        reviewee_id: isBuyer ? transaction.seller_id : transaction.buyer_id,
        rating,
        comment
      });

      if (reviewErr) {
        alert("Failed to submit review: " + reviewErr.message);
        return;
      }

      // 2. Mark transaction as completed
      await updateTransactionStatus('completed', 'Order completed and review left.');
      
      // 3. Notify the reviewee
      await createNotification(
        supabase, 
        isBuyer ? transaction.seller_id : transaction.buyer_id, 
        'review_left', 
        `You received a new ${rating}-star review for ${conversation?.listing?.title}!`, 
        `/user/${session.user.id}`
      );

      setIsReviewModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Something went wrong");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCounterOffer = async (originalMessageId: string) => {
    const amount = Number(counterAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount");
      return;
    }
    
    // Decline old
    await supabase.from("chat_message").update({ offer_status: 'declined' }).eq("id", originalMessageId);
    
    // Insert new offer
    await supabase.from("chat_message").insert({
      conversation_id: conversationId,
      sender_id: session.user.id,
      type: "offer",
      text: `I made a counter offer: Rs ${amount}`,
      offer_amount: amount,
      offer_status: "pending",
      previous_offer_id: Number(originalMessageId),
      timestamp: new Date().toISOString()
    });

    await supabase.from("conversation").update({
      last_offer_status: "pending",
      last_message: `Counter offer: Rs ${amount}`,
      last_message_at: new Date().toISOString()
    }).eq("id", conversationId);

    setCounterMessageId(null);
    setCounterAmount("");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-warm">
      <div className="h-10 w-10 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
    </div>
  );

  const isBuyer = session?.user.id === conversation.buyer_id;
  const otherPartyId = isBuyer ? conversation.seller_id : conversation.buyer_id;
  const listing = conversation.listing;
  const parsedImage = listing?.images ? (typeof listing.images === 'string' ? JSON.parse(listing.images)[0] : listing.images[0]) : "/assets/hero.png";

  return (
    <main className="flex flex-col h-screen bg-surface font-sans">
      <ShippingModal 
        isOpen={isShippingModalOpen} 
        onClose={() => setIsShippingModalOpen(false)} 
        onSubmit={handleSellerShip} 
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleSubmitReview}
      />

      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        onSubmit={handleDisputeSubmit}
      />

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        initialAddress={userProfile?.shipping_address}
        isProcessing={isProcessingPayment}
        onConfirm={async (address) => {
          await handlePaySwich(address);
          setIsPaymentModalOpen(false);
        }}
      />


      {/* Header */}
      <header className="bg-white px-4 py-4 flex items-center justify-between z-10 shrink-0 border-b border-surface-container/60">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={() => router.push("/profile?tab=chats")} className="h-10 w-10 p-0 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          <div className="h-10 w-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold shadow-inner">
            {otherPartyId ? otherPartyId[0].toUpperCase() : "U"}
          </div>
          <div>
            <h2 className="font-serif font-bold text-primary text-base">{isBuyer ? "Seller" : "Buyer"}</h2>
            <p className="text-xs text-secondary font-bold">Active today</p>
          </div>
        </div>
        
        {listing && (
          <Link href={`/item/${listing.id}`} className="flex items-center space-x-3 bg-surface-dim pr-4 pl-1 py-1 rounded-full hover:bg-surface-container transition-colors">
            <div className="h-8 w-8 rounded-full overflow-hidden relative border border-surface-container">
              <Image src={parsedImage || "/assets/hero.png"} alt="Listing" fill className="object-cover" />
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-serif font-bold text-primary truncate max-w-[150px]">{listing.title}</p>
              <p className="text-xs font-bold text-secondary">Rs {listing.price}</p>
            </div>
          </Link>
        )}
      </header>

      {/* Transaction Banner */}
      {transaction && (
        <div className="bg-surface border-b border-surface-container/60 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm animate-slide-in shadow-sm z-10 relative">
          <div className="font-serif font-bold text-primary flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>
              {transaction.status === 'pending_seller_approval' && (isBuyer ? "Order requested. Waiting for seller to accept." : "Buyer wants to purchase this item.")}
              {transaction.status === 'pending' && (isBuyer ? "Please select a payment method to complete your order." : "Waiting for buyer to complete payment.")}
              {transaction.status === 'placed' && (isBuyer ? "Order placed. Waiting for seller to ship." : "Buyer placed an order! Please ship the item.")}
              {transaction.status === 'accepted' && "Order accepted. Awaiting shipment."}
              {transaction.status === 'shipped' && (isBuyer ? "Order shipped! Mark as received when it arrives." : "Order shipped. Waiting for buyer to receive.")}
              {transaction.status === 'received' && "Order received. Please leave a review."}
              {transaction.status === 'completed' && "Transaction completed."}
            </span>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {transaction.status === 'pending_seller_approval' && !isBuyer && (
              <Button onClick={handleSellerAccept} className="w-full sm:w-auto font-bold rounded-full bg-brand-green hover:bg-green-600 text-white h-9 px-5 text-xs cursor-pointer border-none shadow-sm">Accept Order</Button>
            )}
            {transaction.status === 'pending' && isBuyer && (
              <div className="flex gap-2">
                <Button onClick={() => setIsPaymentModalOpen(true)} className="w-full sm:w-auto font-bold rounded-full bg-primary hover:bg-primary-container text-on-primary h-9 px-5 text-xs cursor-pointer border-none shadow-sm">Pay with Card / Wallet</Button>
                <Button onClick={handlePayCOD} className="w-full sm:w-auto font-bold rounded-full bg-surface-dim hover:bg-surface-container text-on-surface-variant h-9 px-5 text-xs cursor-pointer border-none shadow-sm">Cash on Delivery</Button>
              </div>
            )}
            {transaction.status === 'placed' && !isBuyer && (
              <div className="flex flex-col gap-2">
                <Button onClick={() => setIsShippingModalOpen(true)} className="w-full sm:w-auto font-bold rounded-full bg-primary hover:bg-primary-container text-on-primary h-9 px-5 text-xs cursor-pointer border-none shadow-sm">Mark as Shipped</Button>
              </div>
            )}
            {transaction.status === 'shipped' && isBuyer && (
              <>
                <Button onClick={handleBuyerReceive} className="w-full sm:w-auto font-bold rounded-full bg-primary hover:bg-primary-container text-on-primary h-9 px-5 text-xs cursor-pointer border-none shadow-sm">Mark Received</Button>
                <Button onClick={() => setIsDisputeModalOpen(true)} className="w-full sm:w-auto font-bold rounded-full bg-red-100 hover:bg-red-200 text-red-700 h-9 px-5 text-xs cursor-pointer border-none shadow-sm ml-2">I have an issue</Button>
              </>
            )}
            {transaction.status === 'received' && (
              <Button onClick={handleComplete} className="w-full sm:w-auto font-bold rounded-full bg-primary hover:bg-primary-container text-on-primary h-9 px-5 text-xs cursor-pointer border-none shadow-sm">Leave a Review</Button>
            )}
          </div>
        </div>
      )}

      {/* Shipping Details Panel for Seller */}
      {transaction && transaction.status === 'placed' && !isBuyer && transaction.shipping_details && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-4 flex flex-col gap-1 text-sm animate-slide-in shadow-sm z-10 relative">
          <h3 className="font-bold text-amber-900 mb-1 flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
             Shipping Directions
          </h3>
          <p className="text-amber-800 font-medium">Please pack the item securely and ship it to the following address:</p>
          <div className="bg-white/60 p-3 rounded-lg border border-amber-200 mt-2 font-mono text-xs text-amber-900 shadow-sm inline-block self-start">
            <p className="font-bold">{transaction.shipping_details.fullName}</p>
            <p>{transaction.shipping_details.addressLine1}</p>
            <p>{transaction.shipping_details.city}</p>
            <p>Phone: {transaction.shipping_details.phone}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => {
          const isMine = msg.sender_id === session.user.id;
          
          if (msg.type === 'system') {
             return (
               <div key={msg.id} className="flex justify-center my-6">
                 <div className="max-w-[90%] md:max-w-[70%] text-center px-5 py-3 bg-white rounded-xl flex flex-col items-center gap-1 border border-surface-container shadow-sm">
                   <span className="uppercase tracking-widest text-[9px] font-bold text-surface-tint">Transaction Update</span>
                   <span className="text-xs font-bold text-primary">{msg.text}</span>
                 </div>
               </div>
             );
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] md:max-w-[60%] p-3.5 ${
                isMine 
                  ? 'bg-primary text-on-primary rounded-2xl rounded-tr-sm border-transparent' 
                  : 'bg-white text-on-surface rounded-2xl rounded-tl-sm border border-surface-container shadow-sm'
              }`}>
                <p className="text-sm font-medium whitespace-pre-wrap">{msg.text}</p>
                
                {msg.type === 'offer' && (
                  <div className={`mt-3 p-3 rounded-xl border ${isMine ? 'bg-white/10 border-white/20' : 'bg-surface-dim border-surface-container'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isMine ? 'text-white/80' : 'text-on-surface-variant'}`}>
                      Offer Amount
                    </p>
                    <p className={`text-xl font-serif font-extrabold ${isMine ? 'text-white' : 'text-primary'}`}>
                      Rs {msg.offer_amount}
                    </p>
                    
                    {!isMine && msg.offer_status === 'pending' && (
                      <div className="mt-4 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button onClick={() => handleUpdateOffer(msg.id, 'accepted', msg.offer_amount)} className="flex-1 h-9 font-bold text-xs shadow-md bg-primary hover:bg-primary-container text-on-primary rounded">Accept</Button>
                          <Button onClick={() => handleUpdateOffer(msg.id, 'declined')} variant="outline" size="sm" className="flex-1 h-9 font-bold text-xs bg-surface-bright text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded">Decline</Button>
                          <Button onClick={() => setCounterMessageId(msg.id)} variant="outline" size="sm" className="flex-1 h-9 font-bold text-xs bg-surface-bright text-on-surface border-surface-container hover:bg-surface-dim rounded">Counter</Button>
                        </div>
                        
                        {counterMessageId === msg.id && (
                          <div className="flex items-center gap-2 mt-2 bg-surface-bright rounded p-1 border border-surface-container">
                            <span className="pl-3 font-bold text-xs text-on-surface">Rs</span>
                            <input 
                              type="number" 
                              value={counterAmount}
                              onChange={(e) => setCounterAmount(e.target.value)}
                              placeholder="New price"
                              className="flex-1 min-w-0 bg-transparent text-sm outline-none font-bold"
                              autoFocus
                            />
                            <Button onClick={() => handleCounterOffer(msg.id)} size="sm" className="h-7 rounded text-[10px] px-3 bg-primary hover:bg-primary-container text-on-primary">Send</Button>
                            <Button onClick={() => setCounterMessageId(null)} size="sm" variant="ghost" className="h-7 w-7 rounded p-0 text-on-surface-variant hover:bg-surface-dim">✕</Button>
                          </div>
                        )}
                      </div>
                    )}

                    {msg.offer_status !== 'pending' && (
                       <div className="mt-2 text-center">
                         <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                           msg.offer_status === 'accepted' 
                             ? (isMine ? 'bg-white/20 text-white' : 'bg-primary-container/20 text-primary') 
                             : (isMine ? 'bg-red-500/20 text-red-100' : 'bg-red-100 text-red-600')
                         }`}>
                           {msg.offer_status}
                         </span>
                       </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 shrink-0 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-10 relative">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-12 bg-surface-dim border-none rounded-full px-6 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-surface-container transition-all text-on-surface"
          />
          <Button type="submit" disabled={!inputText.trim()} className="h-12 w-12 rounded-full p-0 flex items-center justify-center bg-primary hover:bg-primary-container text-on-primary border-none shadow-sm cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </Button>
        </form>
      </div>
    </main>
  );
}
