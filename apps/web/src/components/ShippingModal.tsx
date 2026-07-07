import { useState } from "react";
import { Button, Card, CardContent } from "@heroui/react";

interface ShippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trackingId: string, courierName: string) => Promise<void>;
}

export function ShippingModal({ isOpen, onClose, onSubmit }: ShippingModalProps) {
  const [trackingId, setTrackingId] = useState("");
  const [courierName, setCourierName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId || !courierName) return;
    setLoading(true);
    try {
      await onSubmit(trackingId, courierName);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <Card className="w-full max-w-md bg-surface border border-surface-container/50 shadow-2xl rounded-2xl overflow-hidden animate-spring">
        <CardContent className="p-6">
          <h2 className="text-xl font-serif font-bold text-on-surface mb-2">Provide Shipping Details</h2>
          <p className="text-sm text-surface-tint mb-6">
            Enter the tracking details so the buyer can track their package.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Courier Name</label>
              <select
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-surface-container rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface text-sm transition-all"
                required
              >
                <option value="" disabled>Select Courier...</option>
                <option value="TCS">TCS</option>
                <option value="Leopards">Leopards Courier</option>
                <option value="M&P">M&P</option>
                <option value="Pakistan Post">Pakistan Post</option>
                <option value="Trax">Trax</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Tracking ID</label>
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-surface-container rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface text-sm transition-all"
                placeholder="e.g. 1234567890"
                required
              />
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
                isDisabled={loading || !trackingId || !courierName}
                className="flex-1 h-12 font-bold bg-primary hover:bg-primary-container text-on-primary border-none shadow-lg shadow-primary/20"
              >
                {loading ? "Saving..." : "Mark as Shipped"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
