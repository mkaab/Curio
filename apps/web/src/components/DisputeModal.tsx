import { useState } from "react";
import { Button, Card, CardContent } from "@heroui/react";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => Promise<void>;
}

export function DisputeModal({ isOpen, onClose, onSubmit }: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !description) return;
    setLoading(true);
    try {
      await onSubmit(reason, description);
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
          <h2 className="text-xl font-serif font-bold text-on-surface mb-2">I have an issue</h2>
          <p className="text-sm text-surface-tint mb-6">
            Please let us know what went wrong. Your funds are secure in Escrow while we resolve this.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-surface-container rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface text-sm transition-all"
                required
              >
                <option value="" disabled>Select an issue...</option>
                <option value="Item not as described">Item not as described</option>
                <option value="Item is damaged/defective">Item is damaged or defective</option>
                <option value="Counterfeit item">Counterfeit item</option>
                <option value="Never received item">I never received the item</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-surface-container rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface text-sm transition-all min-h-[100px] resize-y"
                placeholder="Please describe the issue in detail..."
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onPress={onClose}
                className="flex-1 h-12 font-bold bg-surface-container/30 hover:bg-surface-container text-on-surface"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isDisabled={loading || !reason || !description}
                className="flex-1 h-12 font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
              >
                {loading ? "Submitting..." : "Submit Dispute"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
