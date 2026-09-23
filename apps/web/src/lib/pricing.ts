/**
 * Centralised pricing & fee calculations for Curio.
 * 
 * Single source of truth used by:
 *  - transaction.ts  (createTransaction)
 *  - webhook/route.ts (amount verification)
 *  - PaymentModal.tsx (UI display)
 * 
 * Revenue model:
 *  - Listing is FREE for sellers. No platform commission.
 *  - Curio earns from the Buyer Protection Fee (fixed + percentage).
 *  - Seller receives the full agreed amount + shipping fee.
 */

/** Default flat shipping fee in PKR */
export const DEFAULT_SHIPPING_FEE = 250;

/** Fixed component of buyer protection fee in PKR */
export const BUYER_PROTECTION_FIXED = 150;

/** Variable component of buyer protection fee (5% of item price) */
export const BUYER_PROTECTION_RATE = 0.05;

export interface PricingBreakdown {
  /** The agreed item price between buyer and seller */
  agreedAmount: number;
  /** Shipping fee (flat, passed through to seller) */
  shippingFee: number;
  /** Buyer protection fee — this is Curio's revenue */
  buyerProtectionFee: number;
  /** Total the buyer pays (agreedAmount + shippingFee + buyerProtectionFee) */
  totalBuyerPayment: number;
  /** Net amount credited to seller wallet (agreedAmount + shippingFee) */
  sellerPayout: number;
}

/**
 * Calculates the full pricing breakdown for a transaction.
 * 
 * @param agreedAmount - The item price agreed between buyer and seller
 * @param shippingFee  - Override shipping fee (defaults to DEFAULT_SHIPPING_FEE)
 */
export function calculatePricing(agreedAmount: number, shippingFee = DEFAULT_SHIPPING_FEE): PricingBreakdown {
  const buyerProtectionFee = BUYER_PROTECTION_FIXED + Math.round(agreedAmount * BUYER_PROTECTION_RATE);
  const totalBuyerPayment = agreedAmount + shippingFee + buyerProtectionFee;
  const sellerPayout = agreedAmount + shippingFee;

  return {
    agreedAmount,
    shippingFee,
    buyerProtectionFee,
    totalBuyerPayment,
    sellerPayout,
  };
}
