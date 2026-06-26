import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-primary pt-20 pb-10 px-8 md:px-16 w-full text-white">
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between mb-20 gap-12">
        <div className="max-w-xs">
          <h2 className="text-3xl font-serif font-bold mb-6">Curio</h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8">
            Elevating the experience of finding and owning preloved artifacts for the modern home.
          </p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white transition-colors cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </div>
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white transition-colors cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </div>
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white transition-colors cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
            </div>
          </div>
        </div>
        
        <div className="flex gap-16 md:gap-24">
          <div>
            <h4 className="font-bold text-xs tracking-[0.15em] uppercase mb-6">Marketplace</h4>
            <ul className="space-y-4 text-sm text-white/70">
              <li><Link href="/" className="hover:text-white transition-colors">Our Mission</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Circular Economy</Link></li>
              <li><Link href="/sell" className="hover:text-white transition-colors">Seller Guide</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs tracking-[0.15em] uppercase mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-white/70">
              <li><Link href="/" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Returns</Link></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto w-full pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-white/50">
        <p>© 2024 Curio Marketplace. Sustainably Curated.</p>
        <p className="mt-4 md:mt-0 tracking-wide">Curating for the future, honoring the past.</p>
      </div>
    </footer>
  );
}
