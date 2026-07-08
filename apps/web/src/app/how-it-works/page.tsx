"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="border-t border-primary/20 pt-8 pb-8 flex flex-col h-full relative"
    >
      <div className="text-[11px] font-bold tracking-[0.2em] text-primary/40 mb-6 uppercase" style={{ fontFamily: 'var(--font-jost)' }}>
        Step {number.padStart(2, '0')}
      </div>
      <h3 className="text-3xl font-medium text-primary mb-4" style={{ fontFamily: 'var(--font-cormorant)' }}>{title}</h3>
      <p className="text-primary/80 font-light leading-relaxed flex-grow text-lg" style={{ fontFamily: 'var(--font-jost)' }}>{description}</p>
    </motion.div>
  );
};

/* =========================================
   PAGE
   ========================================= */

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-primary selection:text-on-primary">

      <nav className="absolute top-0 w-full p-6 flex justify-start items-center z-50">
        <Logo className="text-2xl" />
      </nav>

      {/* Editorial Hero Section */}
      <section className="relative w-full pt-20 pb-16 md:pt-20 md:pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="w-full md:w-1/2 flex flex-col items-start text-left">
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-[11.5px] uppercase tracking-[0.2em] text-primary/60 mb-6 font-bold"
              style={{ fontFamily: 'var(--font-jost)' }}
            >
              HOW IT WORKS
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-[48px] md:text-[84px] font-medium text-primary mb-6 tracking-tight leading-[1.1]"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Curate.<br />
              <span className="italic text-primary/70">Circulate.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-[16px] md:text-[20px] text-primary/80 font-light leading-relaxed max-w-md"
              style={{ fontFamily: 'var(--font-jost)' }}
            >
              One community, thousands of brands, and a whole lot of second-hand style. Ready to get started? Here's how it works.
            </motion.p>
          </div>
          <div className="w-full md:w-1/2 relative h-[400px] md:h-[600px] mt-8 md:mt-0">
            <Image
              src="/assets/how_it_works_hero.png"
              alt="Person taking photo of clothes"
              fill
              priority
              className="object-contain object-center md:object-right mix-blend-multiply"
            />
          </div>
        </div>
      </section>

      <main className="relative z-10 pb-24 px-6 max-w-6xl mx-auto flex flex-col items-center">

        {/* Section: For Sellers */}
        <div className="w-full mb-32">
          <div className="flex flex-col mb-12">
            <h2 className="text-[40px] md:text-[54px] font-medium text-primary tracking-tight leading-[1.1]" style={{ fontFamily: 'var(--font-cormorant)' }}>For Sellers</h2>
            <p className="text-[16px] text-primary/60 font-light mt-2 tracking-wide" style={{ fontFamily: 'var(--font-jost)' }}>Zero fees. Zero friction.</p>
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
        <div className="w-full mb-32 relative overflow-hidden">
          <div className="flex flex-col mb-12">
            <h2 className="text-[40px] md:text-[54px] font-medium text-primary tracking-tight leading-[1.1]" style={{ fontFamily: 'var(--font-cormorant)' }}>How to sell 3x faster.</h2>
            <p className="text-[16px] text-primary/60 font-light mt-2 tracking-wide max-w-lg" style={{ fontFamily: 'var(--font-jost)' }}>
              High-quality listings build trust. Follow these 3 golden rules to make your wardrobe irresistible to buyers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Good Example */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square relative rounded-none overflow-hidden shadow-none border border-primary/10 mb-4">
                <Image src="/assets/good_photo.png" alt="Good Listing Photo" fill unoptimized className="object-cover" />
                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] font-bold tracking-widest text-primary flex items-center shadow-sm uppercase" style={{ fontFamily: 'var(--font-jost)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  DO THIS
                </div>
              </div>
              <p className="text-[14px] text-primary/80" style={{ fontFamily: 'var(--font-jost)' }}>Aesthetic, well-lit, centered.</p>
            </div>

            {/* Bad Example */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square relative rounded-none overflow-hidden shadow-none border border-primary/10 mb-4">
                <Image src="/assets/bad_photo.png" alt="Bad Listing Photo" fill unoptimized className="object-cover opacity-90" />
                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] font-bold tracking-widest text-red-600 flex items-center shadow-sm uppercase" style={{ fontFamily: 'var(--font-jost)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  DON'T DO THIS
                </div>
              </div>
              <p className="text-[14px] text-primary/60" style={{ fontFamily: 'var(--font-jost)' }}>Dark, messy background, off-center.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-t border-primary/20 pt-8 pb-8">
              <h4 className="text-[20px] font-medium text-primary mb-4 flex items-center" style={{ fontFamily: 'var(--font-cormorant)' }}>
                <span className="text-[11px] font-bold tracking-[0.2em] text-primary/40 mr-4 uppercase" style={{ fontFamily: 'var(--font-jost)' }}>01</span>
                Lighting is Everything
              </h4>
              <p className="text-[16px] text-primary/80 font-light leading-relaxed" style={{ fontFamily: 'var(--font-jost)' }}>Always shoot in natural daylight. Avoid harsh flash or yellow room lights. A clean, bright photo instantly signals quality.</p>
            </div>
            <div className="border-t border-primary/20 pt-8 pb-8">
              <h4 className="text-[20px] font-medium text-primary mb-4 flex items-center" style={{ fontFamily: 'var(--font-cormorant)' }}>
                <span className="text-[11px] font-bold tracking-[0.2em] text-primary/40 mr-4 uppercase" style={{ fontFamily: 'var(--font-jost)' }}>02</span>
                Show All Angles
              </h4>
              <p className="text-[16px] text-primary/80 font-light leading-relaxed" style={{ fontFamily: 'var(--font-jost)' }}>Buyers appreciate honesty. Include photos of tags, soles, and any minor wear. Transparency prevents returns and builds trust.</p>
            </div>
            <div className="border-t border-primary/20 pt-8 pb-8">
              <h4 className="text-[20px] font-medium text-primary mb-4 flex items-center" style={{ fontFamily: 'var(--font-cormorant)' }}>
                <span className="text-[11px] font-bold tracking-[0.2em] text-primary/40 mr-4 uppercase" style={{ fontFamily: 'var(--font-jost)' }}>03</span>
                Write Like a Stylist
              </h4>
              <p className="text-[16px] text-primary/80 font-light leading-relaxed" style={{ fontFamily: 'var(--font-jost)' }}>Instead of 'blue shirt', write 'Navy oversized linen shirt, perfect for summer.' Detailed, engaging descriptions sell faster.</p>
            </div>
          </div>
        </div>

        {/* Section: For Buyers */}
        <div className="w-full mb-32">
          <div className="flex flex-col mb-12">
            <h2 className="text-[40px] md:text-[54px] font-medium text-primary tracking-tight leading-[1.1]" style={{ fontFamily: 'var(--font-cormorant)' }}>For Buyers</h2>
            <p className="text-[16px] text-primary/60 font-light mt-2 tracking-wide" style={{ fontFamily: 'var(--font-jost)' }}>Premium aesthetics. Pre-loved prices.</p>
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


      </main>
      <Footer />
    </div>
  );
}
