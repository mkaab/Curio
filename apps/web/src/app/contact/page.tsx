import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Curio",
  description: "Get in touch with the Curio support team.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-surface font-sans flex flex-col">
      <Header showSearch={true} />

      <div className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-20 animate-fade-in w-full">
        <h1 className="text-4xl md:text-5xl font-serif font-black text-primary mb-8 tracking-tight">Contact Us</h1>

        <div className="bg-surface-bright border border-surface-container rounded-lg p-8">
          <h2 className="text-2xl font-serif font-bold text-primary mb-4">We're here to help</h2>
          <p className="text-on-surface-variant mb-8">
            Have a question about an order, need help setting up your wallet, or want to report an issue? Reach out to our support team and we'll get back to you within 24 hours.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-on-surface mb-1">Company Information</h3>
              <p className="text-surface-tint">Altaserv Limited</p>
              <p className="text-surface-tint">Quaid Block, Bahria Town, Lahore, Pakistan</p>
            </div>

            <div>
              <h3 className="font-bold text-on-surface mb-1">Contact Methods</h3>
              <p className="text-surface-tint">Email: <a href="mailto:support@altaserv.co.uk" className="text-primary hover:underline">support@altaserv.co.uk</a></p>
            </div>

            <div>
              <h3 className="font-bold text-on-surface mb-1">Business Hours</h3>
              <p className="text-surface-tint">Monday - Friday: 9:00 AM - 6:00 PM (PKT)</p>
            </div>

            <div>
              <h3 className="font-bold text-on-surface mb-1">Disputes & Returns</h3>
              <p className="text-surface-tint text-sm max-w-lg">
                If you need to open a dispute regarding a recent purchase, please go to your Profile {'>'} Orders, select the order, and click "Open Dispute". This is the fastest way to get a resolution.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
