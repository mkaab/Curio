import { Button, FrapButton, ProductCard, cn } from "@curio/ui";
import Image from "next/image";
import Link from "next/link";

const MOCK_ITEMS = [
  { id: "1", title: "Vintage Sana Safinaz Pret", price: 12500, brand: "Sana Safinaz", size: "M", image: "/assets/hero.png", seller: "Ayesha K." },
  { id: "2", title: "Limited Edition Sneakers", price: 35000, brand: "Nike", size: "10", image: "/assets/streetwear.png", seller: "Zain R." },
  { id: "3", title: "Embroidered Silk Kurta", price: 8500, brand: "Khaadi", size: "S", image: "/assets/luxury.png", seller: "Mariam S." },
  { id: "4", title: "Hand-painted Leather Bag", price: 5500, brand: "Local Artist", size: "OS", image: "/assets/hero.png", seller: "Sara J." },
  { id: "5", title: "Retro Varsity Jacket", price: 4200, brand: "Vintage", size: "L", image: "/assets/streetwear.png", seller: "Hamza B." },
  { id: "6", title: "Traditional Jhumkas", price: 2500, brand: "Artisan", size: "OS", image: "/assets/luxury.png", seller: "Noor F." },
  { id: "7", title: "Minimalist Linen Trousers", price: 3200, brand: "Generation", size: "M", image: "/assets/hero.png", seller: "Hania M." },
  { id: "8", title: "Suede Chelsea Boots", price: 6500, brand: "Bata Heritage", size: "9", image: "/assets/streetwear.png", seller: "Umar T." },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col selection:bg-accent-green selection:text-white bg-white">
      {/* Search Header */}
      <nav className="sticky top-0 z-50 flex h-[72px] items-center justify-between bg-white px-6 md:px-10 border-b border-ceramic">
        <div className="flex items-center flex-1 mr-8">
           <div className="flex items-center space-x-2 mr-10 cursor-pointer">
              <div className="h-8 w-8 rounded-full bg-brand-green flex items-center justify-center text-white font-bold">C</div>
              <span className="text-xl font-bold text-brand-green uppercase tracking-wider hidden sm:block">Curio</span>
           </div>
           
           <div className="relative flex-1 max-w-2xl group">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-black-soft group-focus-within:text-brand-green transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
             </div>
             <input 
               type="text" 
               placeholder="Search for items, brands, or styles..." 
               className="w-full h-11 bg-ceramic/50 rounded-full pl-12 pr-6 text-sm text-text-black focus:bg-white focus:ring-1 focus:ring-brand-green transition-all outline-none"
             />
           </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/signup">
            <Button variant="outline" size="sm" className="hidden lg:flex border-none font-bold">Sell now</Button>
          </Link>
          <div className="h-6 w-px bg-ceramic mx-2 hidden lg:block" />
          <Link href="/login">
            <Button variant="dark-outline" size="sm" className="border-none font-bold">Sign up | Log in</Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm" className="rounded-full px-6">Sell</Button>
          </Link>
        </div>
      </nav>

      {/* Category Strip */}
      <div className="flex items-center justify-center space-x-12 px-6 md:px-10 h-14 bg-white border-b border-ceramic overflow-x-auto no-scrollbar">
        {["Women", "Men", "Kids", "Home", "Entertainment", "About"].map(cat => (
          <a key={cat} href="#" className="text-sm font-bold text-text-black hover:text-brand-green whitespace-nowrap transition-colors uppercase tracking-widest">{cat}</a>
        ))}
      </div>

      {/* Seller Onboarding Banner */}
      <section className="relative w-full h-[320px] bg-neutral-warm overflow-hidden">
        <Image 
          src="/assets/hero.png" 
          alt="Sell on Curio" 
          fill 
          className="object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/80 via-brand-green/40 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-10 md:px-20 text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Ready to declutter?</h2>
          <p className="text-xl mb-8 max-w-md opacity-90">Sell your pre-loved fashion and earn extra cash. It&apos;s free to list.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/signup">
              <Button variant="inverted" size="lg" className="h-14 px-10 text-lg shadow-xl">
                Sell now
              </Button>
            </Link>
            <Button variant="outline-dark" size="lg" className="h-14 px-10 text-lg backdrop-blur-sm border-white/40 hover:bg-white/10">
              Learn how it works
            </Button>
          </div>
        </div>
      </section>

      {/* Marketplace Grid */}
      <div className="flex-1 px-6 md:px-10 pt-12 pb-8">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-bold text-text-black">Popular items</h2>
           <a href="#" className="text-sm font-bold text-brand-green hover:underline">See all</a>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {MOCK_ITEMS.map((item) => (
            <ProductCard 
              key={item.id}
              title={item.title}
              price={item.price}
              image={item.image}
              brand={item.brand}
              size={item.size}
              sellerName={item.seller}
            />
          ))}
          {/* Duplicate for visual density */}
          {MOCK_ITEMS.map((item) => (
            <ProductCard 
              key={`${item.id}-dup`}
              title={item.title}
              price={item.price}
              image={item.image}
              brand={item.brand}
              size={item.size}
              sellerName={item.seller}
            />
          ))}
        </div>
      </div>

      {/* Sell CTA (Fixed for mobile) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
         <Link href="/signup">
           <Button variant="primary" size="lg" className="rounded-full shadow-2xl h-14 px-10 text-lg flex items-center space-x-2">
              <span>Sell now</span>
           </Button>
         </Link>
      </div>

      <FrapButton />
    </main>
  );
}
