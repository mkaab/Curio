import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-20 mt-16 text-center">
        <h1 className="text-5xl font-serif font-bold text-primary mb-8">Careers at Curio</h1>
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-primary/10">
          <h2 className="text-2xl font-bold text-primary mb-4">Join Our Journey</h2>
          <p className="text-primary/70 mb-10 text-lg leading-relaxed max-w-xl mx-auto">
            We are always on the lookout for passionate, driven individuals who share our vision of a sustainable, 
            beautifully curated future. 
          </p>
          
          <div className="bg-secondary/30 p-8 rounded-xl mb-12 border border-secondary">
            <h3 className="font-bold text-primary mb-2 text-lg">Current Openings</h3>
            <p className="text-primary/70">
              We do not have any open positions right now, but we are growing fast!
            </p>
          </div>

          <h3 className="font-bold text-primary text-xl mb-4">Open Submission</h3>
          <p className="text-primary/70 mb-8 leading-relaxed max-w-md mx-auto">
            Think you'd be a great fit? We'd love to hear from you. Send us your CV and a brief introduction, 
            and we'll keep you in mind for future roles.
          </p>
          <a 
            href="mailto:careers@curiomarketplace.com" 
            className="inline-block px-10 py-4 bg-primary text-white font-medium rounded-full hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
          >
            Submit Your CV
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
