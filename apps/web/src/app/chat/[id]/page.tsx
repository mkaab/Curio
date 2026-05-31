"use client";

import { useEffect, useState, use, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@curio/ui";
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
      const { error: txErr } = await supabase.from("transaction").insert({
        listing_id: conversation.listing_id,
        conversation_id: Number(conversationId),
        buyer_id: conversation.buyer_id,
        seller_id: conversation.seller_id,
        agreed_amount: amount,
        platform_fee: 0,
        seller_payout: amount,
        status: 'pending', // Switched back to pending
        payment_gateway: 'cod' 
      });
      if (txErr) {
        console.error("Failed to create transaction:", txErr);
        alert("Offer accepted, but failed to create order: " + txErr.message);
      } else {
        alert("Order created successfully!");
      }
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
    <main className="flex flex-col h-screen bg-neutral-warm font-sans">
      {/* Header */}
      <header className="bg-white border-b border-ceramic px-4 py-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={() => router.push("/profile?tab=chats")} className="h-10 w-10 p-0 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          <div className="h-10 w-10 rounded-full bg-brand-green text-white flex items-center justify-center font-bold shadow-inner">
            {otherPartyId ? otherPartyId[0].toUpperCase() : "U"}
          </div>
          <div>
            <h2 className="font-bold text-text-black text-sm">{isBuyer ? "Seller" : "Buyer"}</h2>
            <p className="text-xs text-brand-green font-bold">Active today</p>
          </div>
        </div>
        
        {listing && (
          <Link href={`/item/${listing.id}`} className="flex items-center space-x-3 bg-ceramic/30 pr-4 pl-1 py-1 rounded-full hover:bg-ceramic transition-colors">
            <div className="h-8 w-8 rounded-full overflow-hidden relative border border-ceramic">
              <Image src={parsedImage || "/assets/hero.png"} alt="Listing" fill className="object-cover" />
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-text-black truncate max-w-[150px]">{listing.title}</p>
              <p className="text-xs font-bold text-brand-green">Rs {listing.price}</p>
            </div>
          </Link>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => {
          const isMine = msg.sender_id === session.user.id;
          
          if (msg.type === 'system') {
             return (
               <div key={msg.id} className="flex justify-center my-4">
                 <span className="text-xs font-bold text-text-black-soft bg-ceramic/50 px-3 py-1 rounded-full uppercase tracking-wider">
                   {msg.text}
                 </span>
               </div>
             );
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] md:max-w-[60%] p-3.5 rounded-2xl shadow-sm border ${
                isMine 
                  ? 'bg-brand-green text-white rounded-br-sm border-transparent' 
                  : 'bg-white text-text-black rounded-bl-sm border-ceramic'
              }`}>
                <p className="text-sm font-medium whitespace-pre-wrap">{msg.text}</p>
                
                {msg.type === 'offer' && (
                  <div className={`mt-3 p-3 rounded-xl border ${isMine ? 'bg-white/10 border-white/20' : 'bg-brand-green/5 border-brand-green/20'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isMine ? 'text-white/80' : 'text-text-black-soft'}`}>
                      Offer Amount
                    </p>
                    <p className={`text-xl font-extrabold ${isMine ? 'text-white' : 'text-brand-green'}`}>
                      Rs {msg.offer_amount}
                    </p>
                    
                    {!isMine && msg.offer_status === 'pending' && (
                      <div className="mt-4 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button onClick={() => handleUpdateOffer(msg.id, 'accepted', msg.offer_amount)} variant="primary" size="sm" className="flex-1 h-9 font-bold text-xs shadow-md">Accept</Button>
                          <Button onClick={() => handleUpdateOffer(msg.id, 'declined')} variant="outline" size="sm" className="flex-1 h-9 font-bold text-xs bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">Decline</Button>
                          <Button onClick={() => setCounterMessageId(msg.id)} variant="outline" size="sm" className="flex-1 h-9 font-bold text-xs bg-white text-text-black border-ceramic hover:bg-ceramic/50">Counter</Button>
                        </div>
                        
                        {counterMessageId === msg.id && (
                          <div className="flex items-center gap-2 mt-2 bg-white rounded-full p-1 border border-ceramic">
                            <span className="pl-3 font-bold text-xs text-text-black">Rs</span>
                            <input 
                              type="number" 
                              value={counterAmount}
                              onChange={(e) => setCounterAmount(e.target.value)}
                              placeholder="New price"
                              className="flex-1 min-w-0 bg-transparent text-sm outline-none font-bold"
                              autoFocus
                            />
                            <Button onClick={() => handleCounterOffer(msg.id)} size="sm" variant="primary" className="h-7 rounded-full text-[10px] px-3">Send</Button>
                            <Button onClick={() => setCounterMessageId(null)} size="sm" variant="ghost" className="h-7 w-7 rounded-full p-0">✕</Button>
                          </div>
                        )}
                      </div>
                    )}

                    {msg.offer_status !== 'pending' && (
                       <div className="mt-2 text-center">
                         <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                           msg.offer_status === 'accepted' 
                             ? (isMine ? 'bg-white/20 text-white' : 'bg-brand-green/20 text-brand-green') 
                             : (isMine ? 'bg-red-500/20 text-red-100' : 'bg-red-100 text-red-600')
                         }`}>
                           {msg.offer_status}
                         </span>
                       </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-text-black-soft mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-ceramic p-4 shrink-0 pb-safe">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-12 bg-neutral-warm border border-ceramic rounded-full px-5 text-sm focus:outline-none focus:border-brand-green transition-colors"
          />
          <Button type="submit" disabled={!inputText.trim()} variant="primary" className="h-12 w-12 rounded-full p-0 flex items-center justify-center shadow-lg shadow-brand-green/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </Button>
        </form>
      </div>
    </main>
  );
}
