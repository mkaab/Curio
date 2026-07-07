import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Refund Policy | Curio",
  description: "Curio's Return and Refund Policy.",
};

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-surface font-sans flex flex-col">
      <Header showSearch={true} />
      
      <div className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-20 animate-fade-in w-full">
        <h1 className="text-4xl md:text-5xl font-serif font-black text-primary mb-8 tracking-tight">Return & Refund Policy</h1>
        <p className="text-surface-tint mb-12">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-p:text-on-surface-variant prose-headings:text-primary prose-headings:font-serif prose-headings:font-bold max-w-none">
          <h2>1. All Sales Are Final (Generally)</h2>
          <p>
            Because Curio is a peer-to-peer marketplace, <strong>all sales are considered final</strong> once the item is delivered. We do not accept returns if an item does not fit or if you simply change your mind.
          </p>

          <h2>2. Buyer Protection (When You Can Return)</h2>
          <p>
            You are eligible for a full refund (including shipping and Buyer Protection fees) if the item you receive is:
          </p>
          <ul>
            <li>Significantly not as described in the listing.</li>
            <li>Damaged during transit.</li>
            <li>Counterfeit or inauthentic (if it was claimed to be authentic).</li>
            <li>Never shipped by the seller.</li>
          </ul>

          <h2>3. How to Request a Refund</h2>
          <p>
            If you experience an issue, you must open a <strong>Dispute</strong> within <strong>48 hours</strong> of the item being marked as "Delivered". You can do this by going to your Profile {'>'} Orders {'>'} Open Dispute. You will be asked to provide photos and an explanation.
          </p>

          <h2>4. The Return Process</h2>
          <p>
            If Curio approves your dispute, we will provide you with the seller's return address. You must ship the item back within 3 business days and provide tracking information. Once the seller receives the returned item in its original condition, your refund will be processed back to your original payment method within 5-7 business days.
          </p>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
