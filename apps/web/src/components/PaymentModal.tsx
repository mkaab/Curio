import { useState } from "react";
import { Button, Card, CardContent } from "@heroui/react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAddress?: any;
  isProcessing: boolean;
  onConfirm: (address: any) => Promise<void>;
}

export function PaymentModal({ isOpen, onClose, initialAddress, isProcessing, onConfirm }: PaymentModalProps) {
  const [address, setAddress] = useState(initialAddress || {
    fullName: "",
    addressLine1: "",
    city: "",
    phone: ""
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.addressLine1 || !address.city || !address.phone) return;
    await onConfirm(address);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <Card className="w-full max-w-md bg-surface border border-surface-container/50 shadow-2xl rounded-2xl overflow-hidden animate-spring">
        <CardContent className="p-6">
          <h2 className="text-xl font-serif font-bold text-on-surface mb-2">Shipping Details</h2>
          <p className="text-sm text-surface-tint mb-6">
            Where should the seller ship your item?
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Full Name</label>
              <input
                type="text"
                value={address.fullName}
                onChange={(e) => setAddress({...address, fullName: e.target.value})}
                className="w-full px-4 py-3 bg-surface border border-surface-container rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface text-sm transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Address Line 1</label>
              <input
                type="text"
                value={address.addressLine1}
                onChange={(e) => setAddress({...address, addressLine1: e.target.value})}
                className="w-full px-4 py-3 bg-surface border border-surface-container rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface text-sm transition-all"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">City</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({...address, city: e.target.value})}
                  className="w-full px-4 py-3 bg-surface border border-surface-container rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface text-sm transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Phone Number</label>
                <input
                  type="text"
                  value={address.phone}
                  onChange={(e) => setAddress({...address, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-surface border border-surface-container rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
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
                {isProcessing ? "Processing..." : "Continue to Pay"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
