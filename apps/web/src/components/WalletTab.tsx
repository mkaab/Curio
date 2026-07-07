"use client";

import { useEffect, useState } from "react";
import { Button } from "@curio/ui";
import { getWalletBalance, requestWithdrawal, Wallet, WalletTransaction } from "@/app/actions/wallet";

export function WalletTab({ userId }: { userId: string }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [error, setError] = useState("");

  const fetchWallet = async () => {
    try {
      const data = await getWalletBalance(userId);
      setWallet(data.wallet);
      setTransactions(data.transactions);
    } catch (err: any) {
      setError(err.message || "Failed to load wallet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [userId]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    
    setIsWithdrawing(true);
    setError("");
    try {
      await requestWithdrawal(userId, amount);
      setWithdrawAmount("");
      await fetchWallet(); // Refresh balance
      alert("Withdrawal request submitted! It is now pending approval.");
    } catch (err: any) {
      setError(err.message || "Failed to process withdrawal.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-slide-in">
      <h2 className="text-2xl font-serif font-bold text-primary mb-6">My Wallet</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-primary rounded-2xl p-6 text-on-primary shadow-md flex flex-col justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-primary-container">Current Balance</p>
            <h3 className="text-4xl md:text-5xl font-serif font-extrabold mt-2">Rs {wallet?.balance?.toLocaleString() || "0"}</h3>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <p className="text-xs text-primary-container">Securely stored with Swich Gateway</p>
          </div>
        </div>

        <div className="bg-surface-bright rounded-2xl p-6 border border-surface-container shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-primary mb-2">Withdraw Funds</h4>
            <p className="text-xs text-surface-tint mb-4">Transfer your balance to your connected bank account.</p>
            {error && <p className="text-red-500 font-bold text-xs mb-3">{error}</p>}
            <form onSubmit={handleWithdraw} className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-surface-tint">Rs</span>
                <input 
                  type="number"
                  placeholder="0"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-dim border border-surface-container rounded focus:outline-none focus:border-primary text-sm font-bold"
                  min="1"
                  step="1"
                />
              </div>
              <Button type="submit" disabled={isWithdrawing || !wallet || wallet.balance <= 0} className="w-full font-bold bg-brand-green hover:bg-green-600 text-white rounded">
                {isWithdrawing ? "Processing..." : "Withdraw"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-primary mb-4">Transaction History</h3>
        
        {transactions.length === 0 ? (
          <div className="bg-surface-bright rounded-xl border border-surface-container p-8 text-center">
             <p className="text-surface-tint font-bold">No transactions yet.</p>
          </div>
        ) : (
          <div className="bg-surface-bright rounded-xl border border-surface-container overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-dim border-b border-surface-container text-xs uppercase font-bold text-surface-tint">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {transactions.map(tx => {
                    const isCredit = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-surface-dim/50 transition-colors">
                        <td className="px-4 py-3 text-on-surface whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-on-surface capitalize">{tx.type.replace('_', ' ')}</p>
                          {tx.reference_note && <p className="text-xs text-surface-tint">{tx.reference_note}</p>}
                        </td>
                        <td className={`px-4 py-3 font-bold whitespace-nowrap ${isCredit ? 'text-brand-green' : 'text-on-surface'}`}>
                          {isCredit ? '+' : ''}{tx.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                           <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                             tx.status === 'completed' ? 'bg-primary/10 text-primary' : 
                             tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                           }`}>
                             {tx.status}
                           </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
