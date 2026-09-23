"use client";

import { Button } from "@heroui/react";
import Image from "next/image";
import { parseListingImages } from "@/lib/listings";

interface OrdersTabProps {
  ordersList: any[];
  session: any;
  supabase: any;
  setOrdersList: React.Dispatch<React.SetStateAction<any[]>>;
}

export function OrdersTab({ ordersList, session, supabase, setOrdersList }: OrdersTabProps) {
  return (
    <div className="animate-slide-in">
      <h2 className="text-xl font-serif font-medium text-primary mb-6">My Orders</h2>
      {ordersList.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="h-16 w-16 bg-surface-dim rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant"><path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8.5"/><path d="M21 5.5v5l-9 4-9-4v-5"/><path d="m3 5.5 9-4 9 4"/></svg>
          </div>
          <h3 className="text-xl font-serif font-medium text-primary mb-2">No orders yet</h3>
          <p className="text-on-surface-variant max-w-sm">When you buy or sell items, your orders will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {ordersList.map(order => {
            const isSeller = session.user.id === order.seller_id;
            const otherName = isSeller ? order.buyer?.name : order.seller?.name;
            const parsedImage = parseListingImages(order.listing?.images)[0];
            
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
  );
}
