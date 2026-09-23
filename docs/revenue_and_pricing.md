# Curio — Revenue & Pricing Model

## Overview

Curio is a **free-to-list** marketplace. Sellers pay nothing to list items. Revenue comes exclusively from the **Buyer Protection Fee** charged to buyers at checkout. All fee calculations live in [`pricing.ts`](../apps/web/src/lib/pricing.ts) — the single source of truth across the codebase.

---

## How It Works

```
Seller lists item at Rs 5,000
  ↓
Buyer sees Rs 5,000 on the listing page
  ↓
At checkout, buyer pays:
  Item price:          Rs 5,000
  Buyer Protection:    Rs   400  (150 fixed + 5% of item price)
  Shipping:            Rs   250  (flat fee, shown at checkout)
  ─────────────────────────────
  Total:               Rs 5,650
  ↓
Order shipped & received by buyer
  ↓
Seller is credited:    Rs 5,250  (item price + shipping fee)
Curio keeps:           Rs   400  (buyer protection fee = revenue)
```

---

## Fee Breakdown

### Buyer Protection Fee (Curio's Revenue)

| Component | Value |
|---|---|
| **Fixed** | Rs 150 per transaction |
| **Variable** | 5% of agreed item price |
| **Charged to** | Buyer (added at checkout) |

```
buyerProtectionFee = 150 + round(agreedAmount × 0.05)
```

### Shipping Fee (Pass-through)

| Parameter | Value |
|---|---|
| **Default** | Rs 250 flat |
| **Charged to** | Buyer (shown at checkout) |
| **Passed to** | Seller (included in seller payout) |
| **Revenue?** | **No** — fully passed through to seller |

### Platform Commission

**None.** Listing is free. Seller receives the full item price + shipping fee.

---

## Formulas

```
totalBuyerPayment = agreedAmount + shippingFee + buyerProtectionFee
sellerPayout      = agreedAmount + shippingFee
curioRevenue      = buyerProtectionFee
```

---

## Revenue at Different Price Points

| Item Price | Buyer Protection | Shipping | **Buyer Pays** | **Seller Gets** | **Curio Revenue** | **Take Rate** |
|---|---|---|---|---|---|---|
| Rs 1,000 | Rs 200 | Rs 250 | Rs 1,450 | Rs 1,250 | **Rs 200** | 13.8% |
| Rs 2,500 | Rs 275 | Rs 250 | Rs 3,025 | Rs 2,750 | **Rs 275** | 9.1% |
| Rs 5,000 | Rs 400 | Rs 250 | Rs 5,650 | Rs 5,250 | **Rs 400** | 7.1% |
| Rs 10,000 | Rs 650 | Rs 250 | Rs 10,900 | Rs 10,250 | **Rs 650** | 6.0% |
| Rs 25,000 | Rs 1,400 | Rs 250 | Rs 26,650 | Rs 25,250 | **Rs 1,400** | 5.3% |
| Rs 50,000 | Rs 2,650 | Rs 250 | Rs 52,900 | Rs 50,250 | **Rs 2,650** | 5.0% |

> **Note:** Take rate decreases at higher price points because the fixed Rs 150 becomes proportionally smaller. At scale, the blended rate converges toward ~5%.

---

## Payment Gateways

| Gateway | Type | Seller Wallet Credit |
|---|---|---|
| **Swich** | Online (JazzCash, EasyPaisa, cards) | ✅ Credited on delivery confirmation |
| **COD** | Cash on Delivery | ❌ Seller collects from courier directly |

### COD Note
On COD orders, the buyer protection fee is **not collected digitally**. The seller collects the full amount from the courier. This is a known gap — a future improvement would deduct the buyer protection fee from the seller's wallet balance on COD orders.

---

## Where Fees Are Enforced in Code

| File | Role |
|---|---|
| [`pricing.ts`](../apps/web/src/lib/pricing.ts) | **Source of truth** — all formulas |
| [`transaction.ts`](../apps/web/src/app/actions/transaction.ts) | Creates transactions with correct breakdown |
| [`initiate/route.ts`](../apps/web/src/app/api/payment/swich/initiate/route.ts) | Sends correct total to Swich |
| [`webhook/route.ts`](../apps/web/src/app/api/payment/swich/webhook/route.ts) | Verifies amount after payment (anti-tampering) |
| [`callback/route.ts`](../apps/web/src/app/api/payment/swich/callback/route.ts) | Fallback verification if webhook dropped |
| [`wallet.ts`](../apps/web/src/app/actions/wallet.ts) | Credits `sellerPayout` to seller wallet on delivery |

---

## Future Revenue Opportunities

1. **Promoted listings** — Paid visibility boost (new revenue stream)
2. **Dynamic shipping** — Replace flat Rs 250 with weight/distance-based pricing
3. **COD fee collection** — Deduct buyer protection fee from seller's wallet on COD orders
4. **Tiered buyer protection** — Premium protection tiers at higher fee rates
