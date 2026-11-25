"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { useTranslation } from "@/lib/i18n/client";
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
  stepLabel,
  number,
  title,
  description,
  delay = 0
}: {
  stepLabel: string,
  number: string,
  title: string,
  description: string,
  icon?: React.ReactNode,
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
      <div className="text-[11px] font-bold tracking-[0.2em] text-primary/40 mb-6 uppercase">
        {stepLabel} {number.padStart(2, '0')}
      </div>
      <h3 className="text-3xl font-serif font-medium text-primary mb-4">{title}</h3>
      <p className="text-primary/80 font-light leading-relaxed flex-grow text-lg">{description}</p>
    </motion.div>
  );
};

/* =========================================
   PAGE
   ========================================= */

export default function HowItWorksPage() {
  const { t } = useTranslation();

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
            >
              {t("howItWorks.eyebrow")}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-[48px] md:text-[84px] font-serif font-medium text-primary mb-6 tracking-tight leading-[1.1]"
            >
              {t("howItWorks.heroLine1")}<br />
              <span className="italic text-primary/70">{t("howItWorks.heroLine2")}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-[16px] md:text-[20px] text-primary/80 font-light leading-relaxed max-w-md"
            >
              {t("howItWorks.heroSubtitle")}
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
            <h2 className="text-[40px] md:text-[54px] font-serif font-medium text-primary tracking-tight leading-[1.1]">{t("howItWorks.forSellers")}</h2>
            <p className="text-[16px] text-primary/60 font-light mt-2 tracking-wide">{t("howItWorks.forSellersSub")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              stepLabel={t("howItWorks.stepLabel")}
              number="1"
              delay={0}
              title={t("howItWorks.sellerStep1Title")}
              description={t("howItWorks.sellerStep1Desc")}
            />
            <StepCard
              stepLabel={t("howItWorks.stepLabel")}
              number="2"
              delay={0.1}
              title={t("howItWorks.sellerStep2Title")}
              description={t("howItWorks.sellerStep2Desc")}
            />
            <StepCard
              stepLabel={t("howItWorks.stepLabel")}
              number="3"
              delay={0.2}
              title={t("howItWorks.sellerStep3Title")}
              description={t("howItWorks.sellerStep3Desc")}
            />
          </div>
        </div>

        {/* Section: Seller Pro Tips */}
        <div className="w-full mb-32 relative overflow-hidden">
          <div className="flex flex-col mb-12">
            <h2 className="text-[40px] md:text-[54px] font-serif font-medium text-primary tracking-tight leading-[1.1]">{t("howItWorks.tipsHeading")}</h2>
            <p className="text-[16px] text-primary/60 font-light mt-2 tracking-wide max-w-lg">
              {t("howItWorks.tipsSub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Good Example */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square relative rounded-none overflow-hidden shadow-none border border-primary/10 mb-4">
                <Image src="/assets/good_photo.png" alt="Good Listing Photo" fill unoptimized className="object-cover" />
                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] font-bold tracking-widest text-primary flex items-center shadow-sm uppercase">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  {t("howItWorks.doThis")}
                </div>
              </div>
              <p className="text-[14px] text-primary/80">{t("howItWorks.doThisCaption")}</p>
            </div>

            {/* Bad Example */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square relative rounded-none overflow-hidden shadow-none border border-primary/10 mb-4">
                <Image src="/assets/bad_photo.png" alt="Bad Listing Photo" fill unoptimized className="object-cover opacity-90" />
                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] font-bold tracking-widest text-red-600 flex items-center shadow-sm uppercase">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  {t("howItWorks.dontDoThis")}
                </div>
              </div>
              <p className="text-[14px] text-primary/60">{t("howItWorks.dontDoThisCaption")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-t border-primary/20 pt-8 pb-8">
              <h4 className="text-[20px] font-serif font-medium text-primary mb-4 flex items-center">
                <span className="text-[11px] font-bold tracking-[0.2em] text-primary/40 mr-4 uppercase">01</span>
                {t("howItWorks.rule1Title")}
              </h4>
              <p className="text-[16px] text-primary/80 font-light leading-relaxed">{t("howItWorks.rule1Desc")}</p>
            </div>
            <div className="border-t border-primary/20 pt-8 pb-8">
              <h4 className="text-[20px] font-serif font-medium text-primary mb-4 flex items-center">
                <span className="text-[11px] font-bold tracking-[0.2em] text-primary/40 mr-4 uppercase">02</span>
                {t("howItWorks.rule2Title")}
              </h4>
              <p className="text-[16px] text-primary/80 font-light leading-relaxed">{t("howItWorks.rule2Desc")}</p>
            </div>
            <div className="border-t border-primary/20 pt-8 pb-8">
              <h4 className="text-[20px] font-serif font-medium text-primary mb-4 flex items-center">
                <span className="text-[11px] font-bold tracking-[0.2em] text-primary/40 mr-4 uppercase">03</span>
                {t("howItWorks.rule3Title")}
              </h4>
              <p className="text-[16px] text-primary/80 font-light leading-relaxed">{t("howItWorks.rule3Desc")}</p>
            </div>
          </div>
        </div>

        {/* Section: For Buyers */}
        <div className="w-full mb-32">
          <div className="flex flex-col mb-12">
            <h2 className="text-[40px] md:text-[54px] font-serif font-medium text-primary tracking-tight leading-[1.1]">{t("howItWorks.forBuyers")}</h2>
            <p className="text-[16px] text-primary/60 font-light mt-2 tracking-wide">{t("howItWorks.forBuyersSub")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              stepLabel={t("howItWorks.stepLabel")}
              number="1"
              delay={0}
              title={t("howItWorks.buyerStep1Title")}
              description={t("howItWorks.buyerStep1Desc")}
            />
            <StepCard
              stepLabel={t("howItWorks.stepLabel")}
              number="2"
              delay={0.1}
              title={t("howItWorks.buyerStep2Title")}
              description={t("howItWorks.buyerStep2Desc")}
            />
            <StepCard
              stepLabel={t("howItWorks.stepLabel")}
              number="3"
              delay={0.2}
              title={t("howItWorks.buyerStep3Title")}
              description={t("howItWorks.buyerStep3Desc")}
            />
          </div>
        </div>


      </main>
      <Footer />
    </div>
  );
}
