import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Curio",
  description: "Curio's Terms of Service and user agreement.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface font-sans flex flex-col">
      <Header showSearch={true} />
      
      <div className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-20 animate-fade-in w-full">
        <h1 className="text-4xl md:text-5xl font-serif font-black text-primary mb-8 tracking-tight">Terms of Service</h1>
        <p className="text-surface-tint mb-12">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-p:text-on-surface-variant prose-headings:text-primary prose-headings:font-serif prose-headings:font-bold max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Curio marketplace, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2>2. User Accounts</h2>
          <p>
            You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree not to disclose your password to any third party.
          </p>

          <h2>3. Buying and Selling</h2>
          <p>
            Curio is a marketplace that allows users to offer, sell, and buy preloved items. We are not directly involved in the transaction between buyers and sellers, though we provide secure payment gateways and buyer protection services to facilitate safe transactions.
          </p>
          <ul>
            <li><strong>Sellers:</strong> You must accurately describe your items. You are responsible for shipping the item within the agreed timeframe.</li>
            <li><strong>Buyers:</strong> You are responsible for reading the full item listing before making a purchase. All sales are final unless an item is significantly not as described.</li>
          </ul>

          <h2>4. Prohibited Items</h2>
          <p>
            Users may not list items that are illegal, counterfeit, or violate our community guidelines. Curio reserves the right to remove any listing at our discretion.
          </p>

          <h2>5. Dispute Resolution</h2>
          <p>
            If an issue arises with an order, buyers must open a dispute within 48 hours of delivery. Curio will review the dispute and make a final determination regarding refunds or returns.
          </p>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
