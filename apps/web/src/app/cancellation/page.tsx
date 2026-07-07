import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation Policy | Curio",
  description: "Curio's Order Cancellation Policy.",
};

export default function CancellationPage() {
  return (
    <main className="min-h-screen bg-surface font-sans flex flex-col">
      <Header showSearch={true} />
      
      <div className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-20 animate-fade-in w-full">
        <h1 className="text-4xl md:text-5xl font-serif font-black text-primary mb-8 tracking-tight">Cancellation Policy</h1>
        <p className="text-surface-tint mb-12">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-p:text-on-surface-variant prose-headings:text-primary prose-headings:font-serif prose-headings:font-bold max-w-none">
          <h2>1. Buyer Cancellations</h2>
          <p>
            As a buyer, you may request to cancel an order at any point <strong>before the seller marks the item as "Shipped"</strong>. If the item has not yet shipped, the cancellation will be processed automatically and you will receive a full refund to your original payment method.
          </p>
          <p>
            Once a seller has shipped an item and provided a tracking number, the order <strong>cannot be cancelled</strong>. You must wait to receive the item and then follow the Return & Refund Policy if there is a problem.
          </p>

          <h2>2. Seller Cancellations</h2>
          <p>
            Sellers may cancel an order before shipping if they can no longer fulfill it (e.g., the item was lost or damaged before shipping). Frequent cancellations by a seller will negatively impact their seller rating and may lead to account suspension.
          </p>

          <h2>3. Automated Cancellations</h2>
          <p>
            If a seller fails to ship an item and upload tracking information within <strong>5 business days</strong> of the purchase date, Curio reserves the right to automatically cancel the order and issue a full refund to the buyer.
          </p>

          <h2>4. Refund Processing Time</h2>
          <p>
            Once a cancellation is confirmed, refunds are processed immediately on our end. However, depending on your bank or credit card provider, it may take <strong>3-7 business days</strong> for the funds to reflect in your account.
          </p>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
