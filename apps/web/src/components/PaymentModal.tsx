import { useState } from "react";
import { Button, Card, CardContent } from "@heroui/react";
import { calculatePricing } from "@/lib/pricing";

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  city: string;
  phone: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreedAmount: number;
  initialAddress?: ShippingAddress;
  isProcessing: boolean;
  onConfirm: (address: ShippingAddress) => Promise<void>;
}

export function PaymentModal({ isOpen, onClose, agreedAmount, initialAddress, isProcessing, onConfirm }: PaymentModalProps) {
  const [address, setAddress] = useState(initialAddress || {
    fullName: "",
    addressLine1: "",
    city: "",
    phone: ""
  });

  if (!isOpen) return null;

  const pricing = calculatePricing(agreedAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.addressLine1 || !address.city || !address.phone) return;
    await onConfirm(address);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <Card className="w-full max-w-md bg-surface border border-surface-container/50 shadow-2xl rounded-2xl overflow-hidden animate-spring">
        <CardContent className="p-6">
          <h2 className="text-xl font-serif font-bold text-on-surface mb-2">Checkout</h2>
          <p className="text-sm text-surface-tint mb-5">
            Review your order and enter shipping details.
          </p>

          {/* Order Summary */}
          <div className="bg-surface-dim/50 border border-surface-container rounded-xl p-4 mb-5">
            <h3 className="text-xs font-bold text-surface-tint uppercase tracking-wider mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-on-surface">
                <span>Item price</span>
                <span>₨ {pricing.agreedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-on-surface">
                <span className="flex items-center gap-1">
                  Buyer Protection
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </span>
                <span>₨ {pricing.buyerProtectionFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-on-surface">
                <span>Shipping</span>
                <span>₨ {pricing.shippingFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-surface-container my-2" />
              <div className="flex justify-between font-bold text-on-surface text-base">
                <span>Total</span>
                <span className="text-primary">₨ {pricing.totalBuyerPayment.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Shipping Form */}
          <h3 className="text-xs font-bold text-surface-tint uppercase tracking-wider mb-3">Shipping Details</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={address.fullName}
                onChange={(e) => setAddress({...address, fullName: e.target.value})}
                className="w-full px-4 py-3 bg-surface border border-surface-container rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface text-sm transition-all"
                required
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Address"
                value={address.addressLine1}
                onChange={(e) => setAddress({...address, addressLine1: e.target.value})}
                className="w-full px-4 py-3 bg-surface border border-surface-container rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface text-sm transition-all"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({...address, city: e.target.value})}
                  className="w-full px-4 py-3 bg-surface border border-surface-container rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface text-sm transition-all"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={address.phone}
                  onChange={(e) => setAddress({...address, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-surface border border-surface-container rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="ghost"
                onPress={onClose}
                className="flex-1 h-12 font-bold bg-surface-container/30 hover:bg-surface-container text-on-surface border-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isDisabled={isProcessing}
                className="flex-1 h-12 font-bold bg-primary hover:bg-primary-container text-on-primary border-none shadow-lg shadow-primary/20"
              >
                {isProcessing ? "Processing..." : `Pay ₨ ${pricing.totalBuyerPayment.toLocaleString()}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
