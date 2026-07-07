import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Curio",
  description: "Curio's Privacy Policy and data handling practices.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface font-sans flex flex-col">
      <Header showSearch={true} />
      
      <div className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-20 animate-fade-in w-full">
        <h1 className="text-4xl md:text-5xl font-serif font-black text-primary mb-8 tracking-tight">Privacy Policy</h1>
        <p className="text-surface-tint mb-12">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-p:text-on-surface-variant prose-headings:text-primary prose-headings:font-serif prose-headings:font-bold max-w-none">
          <h2>1. Information We Collect</h2>
          <p>
            When you use Curio, we collect personal information you provide to us, including your name, email address, physical address, and payment information (handled securely by our payment partners like Swich). We also collect information about your interactions with the platform, such as your browsing history, favorites, and chat logs.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use your information to operate and improve the Curio marketplace. This includes processing transactions, communicating with you about your orders, sending you push notifications, and ensuring the safety and security of all our users.
          </p>

          <h2>3. Information Sharing</h2>
          <p>
            We share necessary information with other users to facilitate transactions (e.g., sharing your shipping address with a seller). We do not sell your personal data to third parties.
          </p>

          <h2>4. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data. Your payment information is encrypted and processed directly by our payment gateways; we do not store your full credit card or bank details on our servers.
          </p>

          <h2>5. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. You can manage your information directly through your Profile settings or contact our support team for assistance.
          </p>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
