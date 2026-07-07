"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { markWithdrawalCompleted, rejectWithdrawal, resolveDispute, checkIsAdmin } from "@/app/actions/admin";
import { Button } from "@heroui/react";

type Tab = "payouts" | "disputes";

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>("payouts");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // Check admin status client-side (though page should be protected server-side too ideally)
      const adminRes = await checkIsAdmin();
      if (!adminRes) {
        router.push("/");
        return;
      }
      setIsAdmin(true);

      // Fetch pending withdrawals
      const { data: wData, error: wError } = await supabase
        .from("wallet_transaction")
        .select(`
          id,
          amount,
          created_at,
          status,
          wallet (
            user_id,
            user:user_id (
              id,
              name,
              email,
              bank_name,
              bank_account_title,
              bank_account_number
            )
          )
        `)
        .eq("type", "withdrawal")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
        
      if (!wError && wData) setWithdrawals(wData);

      // Fetch open disputes
      const { data: dData, error: dError } = await supabase
        .from("dispute")
        .select(`
          id,
          reason,
          description,
          created_at,
          transaction:transaction_id (
            id,
            agreed_amount,
            buyer_id,
            seller_id,
            buyer:buyer_id (name, email),
            seller:seller_id (name, email),
            listing:listing_id (title)
          )
        `)
        .eq("status", "open")
        .order("created_at", { ascending: true });

      if (!dError && dData) setDisputes(dData);
      
      setLoading(false);
    }
    init();
  }, [router, supabase]);

  if (isAdmin === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dim">
         <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleMarkTransferred = async (id: string) => {
    setActionLoading(`transfer-${id}`);
    try {
      await markWithdrawalCompleted(id);
      setWithdrawals(prev => prev.filter(w => w.id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPayout = async (id: string) => {
    const reason = prompt("Enter reason for rejecting this payout (e.g., Invalid IBAN):", "Invalid bank details");
    if (reason === null) return;
    
    setActionLoading(`reject-${id}`);
    try {
      await rejectWithdrawal(id, reason);
      setWithdrawals(prev => prev.filter(w => w.id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveDispute = async (id: number, decision: "refund_buyer" | "pay_seller") => {
    const confirmMsg = decision === "refund_buyer" 
      ? "Are you sure you want to CANCEL this transaction and REFUND the buyer?" 
      : "Are you sure you want to dismiss this dispute and PAY the seller?";
      
    if (!confirm(confirmMsg)) return;

    const notes = prompt("Enter resolution notes for the database record:");
    if (notes === null) return;

    setActionLoading(`resolve-${id}`);
    try {
      await resolveDispute(id, decision, notes);
      setDisputes(prev => prev.filter(d => d.id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-surface pb-24 font-sans selection:bg-primary selection:text-white">
      <Header showSearch={false} />
      
      <div className="max-w-7xl mx-auto px-4 md:px-10 pt-10">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-extrabold text-primary">Admin Command Center</h1>
          <p className="text-surface-tint mt-2">Manage pending payouts and resolve user disputes.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2 border-b border-surface-container mb-8">
          <button 
            onClick={() => setActiveTab("payouts")}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "payouts" ? "border-primary text-primary" : "border-transparent text-surface-tint hover:text-on-surface hover:border-surface-container"}`}
          >
            Pending Payouts ({withdrawals.length})
          </button>
          <button 
            onClick={() => setActiveTab("disputes")}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "disputes" ? "border-primary text-primary" : "border-transparent text-surface-tint hover:text-on-surface hover:border-surface-container"}`}
          >
            Open Disputes ({disputes.length})
          </button>
        </div>

        {/* PAYOUTS TAB */}
        {activeTab === "payouts" && (
          <div className="bg-surface-bright border border-surface-container rounded-2xl overflow-hidden shadow-sm animate-slide-in">
            <div className="p-6 border-b border-surface-container bg-surface-dim/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">Payout Requests</h2>
            </div>

            {withdrawals.length === 0 ? (
               <div className="p-16 text-center">
                 <div className="h-16 w-16 bg-surface-dim rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                 </div>
                 <h3 className="text-lg font-bold text-on-surface mb-1">All Caught Up!</h3>
                 <p className="text-surface-tint text-sm">There are no pending withdrawal requests at the moment.</p>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-dim/50 border-b border-surface-container text-xs uppercase font-bold text-surface-tint">
                    <tr>
                      <th className="px-6 py-4">Requested</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Bank Details</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {withdrawals.map((tx: any) => {
                      const user = Array.isArray(tx.wallet?.user) ? tx.wallet.user[0] : tx.wallet?.user;
                      const amount = Math.abs(tx.amount);
                      
                      return (
                        <tr key={tx.id} className="hover:bg-surface-dim/30 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-surface-tint">
                            {new Date(tx.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-on-surface">{user?.name || 'Unknown'}</p>
                            <p className="text-xs text-surface-tint">{user?.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            {user?.bank_account_number ? (
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-primary uppercase">{user.bank_name}</p>
                                <p className="text-sm font-medium text-on-surface">{user.bank_account_title}</p>
                                <p className="text-sm font-mono text-surface-tint bg-surface-dim px-2 py-1 rounded inline-block">
                                  {user.bank_account_number}
                                </p>
                              </div>
                            ) : (
                              <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">No Bank Details</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="font-bold text-lg text-on-surface">Rs {amount.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2 items-center">
                              <Button 
                                onPress={() => handleMarkTransferred(tx.id)}
                                isDisabled={!user?.bank_account_number || actionLoading === `transfer-${tx.id}`}
                                className="w-full font-bold text-xs bg-brand-green hover:bg-green-600 text-white shadow-sm border-none disabled:opacity-50"
                              >
                                {actionLoading === `transfer-${tx.id}` ? 'Processing...' : 'Mark Transferred'}
                              </Button>
                              <Button 
                                onPress={() => handleRejectPayout(tx.id)}
                                isDisabled={actionLoading === `reject-${tx.id}`}
                                variant="outline"
                                className="w-full font-bold text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm disabled:opacity-50"
                              >
                                {actionLoading === `reject-${tx.id}` ? 'Processing...' : 'Reject & Refund'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DISPUTES TAB */}
        {activeTab === "disputes" && (
          <div className="bg-surface-bright border border-surface-container rounded-2xl overflow-hidden shadow-sm animate-slide-in">
             <div className="p-6 border-b border-surface-container bg-surface-dim/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">Open Disputes</h2>
            </div>

            {disputes.length === 0 ? (
               <div className="p-16 text-center">
                 <div className="h-16 w-16 bg-surface-dim rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                 </div>
                 <h3 className="text-lg font-bold text-on-surface mb-1">No Active Disputes</h3>
                 <p className="text-surface-tint text-sm">Buyers and sellers are resolving issues smoothly!</p>
               </div>
            ) : (
              <div className="p-6 grid grid-cols-1 gap-6">
                {disputes.map((d: any) => {
                  const tx = d.transaction;
                  const buyer = Array.isArray(tx.buyer) ? tx.buyer[0] : tx.buyer;
                  const seller = Array.isArray(tx.seller) ? tx.seller[0] : tx.seller;
                  const listingTitle = Array.isArray(tx.listing) ? tx.listing[0]?.title : tx.listing?.title;
                  
                  return (
                    <div key={d.id} className="border border-red-200 bg-red-50/30 rounded-xl p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Dispute #{d.id}</span>
                            <span className="text-xs text-surface-tint">{new Date(d.created_at).toLocaleString()}</span>
                          </div>
                          <h3 className="text-lg font-bold text-on-surface">{listingTitle}</h3>
                          <p className="text-sm font-medium text-surface-tint mt-1">Escrow Amount: <strong className="text-primary">Rs {tx.agreed_amount.toLocaleString()}</strong></p>
                        </div>
                        <div className="flex gap-2">
                           <Button 
                             onPress={() => handleResolveDispute(d.id, "refund_buyer")}
                             isDisabled={!!actionLoading}
                             className="font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm border-none disabled:opacity-50"
                           >
                             Refund Buyer
                           </Button>
                           <Button 
                             onPress={() => handleResolveDispute(d.id, "pay_seller")}
                             isDisabled={!!actionLoading}
                             className="font-bold bg-primary hover:bg-primary-container text-on-primary shadow-sm border-none disabled:opacity-50"
                           >
                             Release to Seller
                           </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-red-100">
                        <div>
                          <p className="text-xs font-bold text-surface-tint uppercase mb-2">Complaint Details</p>
                          <div className="bg-white border border-red-100 rounded-lg p-4">
                            <p className="text-sm font-bold text-on-surface mb-1">Reason: {d.reason}</p>
                            <p className="text-sm text-surface-tint">"{d.description}"</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-surface-tint uppercase mb-2">Buyer</p>
                            <div className="bg-white border border-surface-container rounded-lg p-3">
                              <p className="text-sm font-bold text-on-surface">{buyer?.name}</p>
                              <p className="text-xs text-surface-tint">{buyer?.email}</p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-surface-tint uppercase mb-2">Seller</p>
                            <div className="bg-white border border-surface-container rounded-lg p-3">
                              <p className="text-sm font-bold text-on-surface">{seller?.name}</p>
                              <p className="text-xs text-surface-tint">{seller?.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
