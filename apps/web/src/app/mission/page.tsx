import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-20 mt-16">
        <h1 className="text-5xl font-serif font-bold text-primary mb-8 text-center">Our Mission</h1>
        <div className="prose prose-lg mx-auto text-primary/80">
          <p className="text-xl mb-8 leading-relaxed text-center text-primary/70 max-w-2xl mx-auto">
            At Curio, our mission is to elevate the experience of finding and owning preloved artifacts for the modern home. 
            We believe in curating for the future while honoring the past.
          </p>
          <div className="bg-white p-10 rounded-2xl shadow-sm border border-primary/10 mt-12">
            <h2 className="text-2xl font-bold text-primary mb-4">Sustainable Curation</h2>
            <p className="mb-8 leading-relaxed">
              We are deeply committed to the circular economy. Every item that finds a new home through Curio is one less item 
              ending up in a landfill. By choosing preloved, high-quality pieces, you are contributing to a more sustainable 
              future without compromising on aesthetics or quality.
            </p>
            <h2 className="text-2xl font-bold text-primary mb-4">Empowering Sellers</h2>
            <p className="mb-4 leading-relaxed">
              We provide a premium, secure platform for sellers to pass on their cherished belongings to people who will appreciate them.
              Our escrow payment system and transparent processes ensure peace of mind for both buyers and sellers.
            </p>
          </div>
          <div className="mt-16 text-center">
            <Link href="/" className="inline-block px-10 py-4 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl font-medium">
              Explore the Marketplace
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
