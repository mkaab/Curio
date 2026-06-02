"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/* =========================================
   COMPONENTS
   ========================================= */

function TextReveal({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <motion.h1
      className={cn("flex flex-wrap justify-center overflow-hidden", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        visible: { transition: { staggerChildren: 0.08 } },
        hidden: {},
      }}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "100%", opacity: 0, rotate: 10 },
              visible: { y: 0, opacity: 1, rotate: 0, transition: { type: "spring", damping: 12, stiffness: 100 } },
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.h1>
  );
}

const StepCard = ({ 
  number, 
  title, 
  description, 
  icon, 
  delay = 0 
}: { 
  number: string, 
  title: string, 
  description: string, 
  icon: React.ReactNode, 
  delay?: number 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, type: "spring", stiffness: 100 }}
      className="bg-white/50 backdrop-blur-3xl p-8 rounded-[32px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group will-change-transform flex flex-col h-full"
    >
      <div className="absolute top-0 right-0 p-8 text-6xl font-black text-[#1E3932]/15 select-none pointer-events-none transition-transform duration-500 group-hover:scale-110">
        {number}
      </div>
      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#00754A] mb-6 relative z-10 border border-[#f2f0eb]">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[#1E3932] mb-3 relative z-10">{title}</h3>
      <p className="text-[#1E3932]/70 font-medium leading-relaxed relative z-10 flex-grow">{description}</p>
    </motion.div>
  );
};

/* =========================================
   PAGE
   ========================================= */

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#f2f0eb] relative overflow-hidden font-sans selection:bg-[#00754A] selection:text-white">
      
      {/* High-Performance Aurora Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#f2f0eb] z-0" />
        <motion.div 
          animate={{ x: ["0%", "5%", "-5%", "0%"], y: ["0%", "-5%", "5%", "0%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#d4e9e2] to-transparent blur-3xl opacity-60 will-change-transform"
        />
        <motion.div 
          animate={{ x: ["0%", "-8%", "8%", "0%"], y: ["0%", "8%", "-8%", "0%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 1 }}
          className="absolute top-[40%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-white to-[#00754A]/10 blur-3xl opacity-50 will-change-transform"
        />
      </div>

      {/* Navbar */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <Link href="/" className="flex items-center space-x-2 cursor-pointer group">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#006241] flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-110 transition-transform">C</div>
          <span className="text-2xl font-bold text-[#006241] uppercase tracking-wider hidden sm:block">Curio</span>
        </Link>
        <Link href="/" className="text-sm font-bold text-[#006241] hover:text-[#00754A] transition-colors border-b border-transparent hover:border-[#00754A]">
          Back to Marketplace
        </Link>
      </nav>

      <main className="relative z-10 pt-32 pb-24 px-6 md:px-10 max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Hero Header */}
        <div className="text-center max-w-3xl mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            className="inline-block px-4 py-1.5 mb-6 text-[12px] font-bold tracking-[0.15em] text-[#00754A] uppercase bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-white"
          >
            The Process
          </motion.div>
          <TextReveal 
            text="HOW CURIO WORKS." 
            className="text-4xl md:text-6xl font-extrabold text-[#1E3932] mb-6 tracking-wide drop-shadow-sm"
          />
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="text-lg md:text-xl text-[#1E3932]/70 font-medium leading-relaxed tracking-tight"
          >
            The modern, aesthetic, and completely free way to rotate your wardrobe in Pakistan.
          </motion.p>
        </div>

        {/* Section: For Sellers */}
        <div className="w-full mb-32">
          <div className="flex flex-col md:flex-row items-baseline justify-between mb-12 border-b border-[#1E3932]/10 pb-4">
            <h2 className="text-3xl md:text-4xl font-black text-[#1E3932] tracking-tight">For Sellers</h2>
            <p className="text-[#00754A] font-bold mt-2 md:mt-0">Zero fees. Zero friction.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard 
              number="1"
              delay={0}
              title="Snap a pic"
              description="Capture your pre-loved item in good lighting from all angles. Write an honest, detailed description of its condition."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <StepCard 
              number="2"
              delay={0.1}
              title="Name your price"
              description="Set your price based on condition and brand. You have total control over the value of your closet."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
            />
            <StepCard 
              number="3"
              delay={0.2}
              title="Keep 100%"
              description="When your item sells, you keep the entire profit. We take absolutely zero commission cuts."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          </div>
        </div>

        {/* Section: Seller Pro Tips */}
        <div className="w-full mb-32 bg-white/40 backdrop-blur-3xl border border-white p-8 md:p-12 rounded-[40px] shadow-sm relative overflow-hidden">
          <div className="flex flex-col mb-10 text-center">
            <h2 className="text-3xl font-black text-[#1E3932] tracking-tight mb-2">How to sell 3x faster.</h2>
            <p className="text-[#1E3932]/70 font-medium max-w-lg mx-auto">
              High-quality listings build trust. Follow these 3 golden rules to make your wardrobe irresistible to buyers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Good Example */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square relative rounded-3xl overflow-hidden shadow-lg border border-[#f2f0eb] mb-4">
                <Image src="/assets/good_photo.png" alt="Good Listing Photo" fill unoptimized className="object-cover" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#00754A] flex items-center shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  DO THIS
                </div>
              </div>
              <p className="text-sm font-bold text-[#1E3932]">Aesthetic, well-lit, centered.</p>
            </div>
            
            {/* Bad Example */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square relative rounded-3xl overflow-hidden shadow-lg border border-[#f2f0eb] mb-4">
                <Image src="/assets/bad_photo.png" alt="Bad Listing Photo" fill unoptimized className="object-cover opacity-90" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-red-600 flex items-center shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  DON'T DO THIS
                </div>
              </div>
              <p className="text-sm font-bold text-[#1E3932]/70">Dark, messy background, off-center.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/50 p-6 rounded-2xl border border-white">
              <h4 className="font-bold text-[#00754A] mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full bg-[#00754A]/10 flex items-center justify-center mr-2 text-xs">1</span>
                Lighting is Everything
              </h4>
              <p className="text-sm text-[#1E3932]/80 leading-relaxed">Always shoot in natural daylight. Avoid harsh flash or yellow room lights. A clean, bright photo instantly signals quality.</p>
            </div>
            <div className="bg-white/50 p-6 rounded-2xl border border-white">
              <h4 className="font-bold text-[#00754A] mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full bg-[#00754A]/10 flex items-center justify-center mr-2 text-xs">2</span>
                Show All Angles
              </h4>
              <p className="text-sm text-[#1E3932]/80 leading-relaxed">Buyers appreciate honesty. Include photos of tags, soles, and any minor wear. Transparency prevents returns and builds trust.</p>
            </div>
            <div className="bg-white/50 p-6 rounded-2xl border border-white">
              <h4 className="font-bold text-[#00754A] mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full bg-[#00754A]/10 flex items-center justify-center mr-2 text-xs">3</span>
                Write Like a Stylist
              </h4>
              <p className="text-sm text-[#1E3932]/80 leading-relaxed">Instead of 'blue shirt', write 'Navy oversized linen shirt, perfect for summer.' Detailed, engaging descriptions sell faster.</p>
            </div>
          </div>
        </div>

        {/* Section: For Buyers */}
        <div className="w-full mb-32">
          <div className="flex flex-col md:flex-row items-baseline justify-between mb-12 border-b border-[#1E3932]/10 pb-4">
            <h2 className="text-3xl md:text-4xl font-black text-[#1E3932] tracking-tight">For Buyers</h2>
            <p className="text-[#00754A] font-bold mt-2 md:mt-0">Premium aesthetics. Pre-loved prices.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard 
              number="1"
              delay={0}
              title="Discover"
              description="Scroll through a beautifully curated feed of fashion. Filter by brand, style, and aesthetics."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
            <StepCard 
              number="2"
              delay={0.1}
              title="Connect"
              description="Message sellers directly to ask about sizing, condition, or just to negotiate a great deal."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
            />
            <StepCard 
              number="3"
              delay={0.2}
              title="Slay Sustainably"
              description="Look incredible while saving clothes from landfills. High fashion doesn't have to hurt the planet."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          </div>
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="w-full max-w-2xl bg-[#006241] p-12 rounded-[40px] text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-[#004e34] to-transparent pointer-events-none" />
          <h2 className="text-3xl font-extrabold text-white mb-4 relative z-10">Ready to start?</h2>
          <p className="text-white/80 font-medium mb-8 relative z-10 max-w-md mx-auto">
            Join thousands of others buying and selling pre-loved fashion in Pakistan.
          </p>
          <Link href="/" className="relative z-10">
            <button className="bg-white text-[#006241] font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:scale-105 transition-transform">
              Start Exploring
            </button>
          </Link>
        </motion.div>

      </main>
    </div>
  );
}
