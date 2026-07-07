import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy | Curio",
  description: "Curio's Shipping Policy and guidelines.",
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-surface font-sans flex flex-col">
      <Header showSearch={true} />
      
      <div className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-20 animate-fade-in w-full">
        <h1 className="text-4xl md:text-5xl font-serif font-black text-primary mb-8 tracking-tight">Shipping Policy</h1>
        <p className="text-surface-tint mb-12">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-p:text-on-surface-variant prose-headings:text-primary prose-headings:font-serif prose-headings:font-bold max-w-none">
          <h2>1. Shipping Flat Rate</h2>
          <p>
            Curio currently enforces a standardized <strong>Flat Rs 250 Shipping Fee</strong> across all purchases. This fee is automatically added to the buyer's checkout total. Sellers will receive this amount as part of their payout to cover their shipping expenses.
          </p>

          <h2>2. Seller Responsibilities</h2>
          <p>
            Sellers are required to package the item securely and ship it within <strong>3 business days</strong> of a successful purchase. Sellers must use a trackable courier service (e.g., Leopards, TCS, Trax) and upload the tracking ID in their Profile {'>'} Orders tab so the buyer can track the delivery.
          </p>

          <h2>3. Buyer Responsibilities</h2>
          <p>
            Buyers must ensure their shipping address is accurate during checkout. Curio is not responsible for packages delivered to an incorrect address provided by the buyer.
          </p>

          <h2>4. Delayed or Lost Packages</h2>
          <p>
            If an item has not been shipped within 5 business days, the buyer may request a cancellation and full refund. If an item is shipped but lost in transit by the courier, Curio will investigate and assist the buyer in receiving a refund under our Buyer Protection policy.
          </p>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
