export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amountPkr: number;
  platformFeePkr: number;
  shippingFeePkr: number;
  status: 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'disputed' | 'refunded' | 'completed';
  paymentMethod: 'jazzcash' | 'easypaisa' | 'card' | 'bank_transfer';
  paymentRef?: string;
  escrowReleased: boolean;
  trackingNumber?: string;
  courier?: string;
  shippingAddress: any;
  disputeId?: string;
  createdAt: Date;
}
