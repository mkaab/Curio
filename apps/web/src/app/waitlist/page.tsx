"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, useAnimation, useInView, Variants } from "framer-motion";
import { getWaitlistCount, joinWaitlist, getRecentWaitlistNames } from "./actions";
import { useTranslation } from "@/lib/i18n/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { LiveSignupsTicker } from "@/components/LiveSignupsTicker";

/* =========================================
   PREMIUM CULT UI / SKIPER UI COMPONENTS
   ========================================= */

function TextReveal({ text, className, dir = "ltr" }: { text: string; className?: string; dir?: "ltr" | "rtl" }) {
  const lines = text.split("\n");
  return (
    <motion.h1
      dir={dir}
      className={cn("flex flex-col items-center justify-center overflow-hidden", className)}
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.08 } },
        hidden: {},
      }}
    >
      {lines.map((line, lineIdx) => (
        <div key={lineIdx} className="flex flex-wrap justify-center">
          {line.split(" ").map((word, i) => (
            <span key={`${lineIdx}-${i}`} className="inline-block overflow-hidden mr-[0.25em]">
              <motion.span
                className={cn(
                  "inline-block",
                  word.toLowerCase().includes("pre-loved") && "italic bg-primary text-on-primary px-4 py-0.5 rounded-lg shadow-lg"
                )}
                variants={{
                  hidden: { y: "100%", opacity: 0, rotate: 10 },
                  visible: { y: 0, opacity: 1, rotate: 0, transition: { type: "spring", damping: 12, stiffness: 100 } },
                }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </div>
      ))}
    </motion.h1>
  );
}

// 2. Shiny Glowing Input (Cult UI style)
function ShinyInput({ label, name, type, placeholder, disabled }: { label: string, name: string, type: string, placeholder: string, disabled: boolean }) {
  return (
    <div className="flex flex-col text-left relative group">
      <label className="text-[13px] font-bold text-black/60 mb-1.5 ml-1">{label}</label>
      <div className="relative rounded-2xl overflow-hidden p-[2px] transition-all duration-300">
        {/* Animated glowing border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-focus-within:opacity-100 group-hover:opacity-50 blur-sm transition-opacity duration-500 animate-[spin_4s_linear_infinite]" />

        <input
          type={type}
          name={name}
          required
          disabled={disabled}
          placeholder={placeholder}
          className="relative w-full h-14 bg-white/70 backdrop-blur-md px-5 rounded-2xl text-[16px] text-primary placeholder:text-primary/30 outline-none border border-primary/20 focus:bg-white focus:shadow-[0_0_20px_var(--color-primary)] transition-all z-10"
        />
      </div>
    </div>
  );
}

// 2b. Shiny Glowing Select
function ShinySelect({ label, name, options, disabled }: { label: string, name: string, options: string[], disabled: boolean }) {
  return (
    <div className="flex flex-col text-left relative group">
      <label className="text-[13px] font-bold text-black/60 mb-1.5 ml-1">{label}</label>
      <div className="relative rounded-2xl overflow-hidden p-[2px] transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-focus-within:opacity-100 group-hover:opacity-50 blur-sm transition-opacity duration-500 animate-[spin_4s_linear_infinite]" />

        <select
          name={name}
          required
          disabled={disabled}
          className="relative w-full h-14 bg-white/70 backdrop-blur-md px-5 rounded-2xl text-[16px] text-primary outline-none border border-primary/20 focus:bg-white focus:shadow-[0_0_20px_var(--color-primary)] transition-all z-10 appearance-none cursor-pointer"
          defaultValue=""
        >
          <option value="" disabled hidden>Select an option</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none z-20">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// 3. Sweep Gradient Button (Skiper UI style)
function SweepButton({ children, disabled, loading }: { children: ReactNode, disabled: boolean, loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="relative w-full h-[56px] mt-4 rounded-full overflow-hidden group active:scale-95 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <div className="absolute inset-0 bg-primary transition-colors z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out z-0" />
      <div className="relative z-10 flex items-center justify-center w-full h-full text-on-primary font-bold text-[16px]">
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          children
        )}
      </div>
    </button>
  );
}

const ParallaxImages = () => (
  <>
    {/* Sneaker - Top Left */}
    <motion.div
      animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-0 left-0 w-64 h-64 opacity-90 will-change-transform"
    >
      <div className="w-full h-full relative bg-white/50 backdrop-blur-sm p-4 shadow-sm border border-primary/5">
        <Image src="/assets/vintage_sneaker.png" alt="Vintage Sneaker" fill sizes="300px" priority quality={100} className="object-contain drop-shadow-xl p-4" />
      </div>
    </motion.div>

    {/* Sunglasses - Top Right */}
    <motion.div
      animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      className="absolute top-10 right-0 w-48 h-48 opacity-80 will-change-transform"
    >
      <div className="w-full h-full relative bg-white/50 backdrop-blur-sm p-4 shadow-sm border border-primary/5">
        <Image src="/assets/chic_sunglasses.png" alt="Chic Sunglasses" fill sizes="200px" quality={100} className="object-contain drop-shadow-md p-4" />
      </div>
    </motion.div>

    {/* Denim Jacket - Bottom Left */}
    <motion.div
      animate={{ y: [0, -15, 0], x: [0, 5, 0], rotate: [0, -5, 0] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute bottom-10 left-10 w-56 h-56 opacity-80 will-change-transform"
    >
      <div className="w-full h-full relative bg-white/50 backdrop-blur-sm p-4 shadow-sm border border-primary/5">
        <Image src="/assets/vintage_denim_jacket.png" alt="Denim Jacket" fill sizes="250px" quality={100} className="object-contain drop-shadow-lg p-4" />
      </div>
    </motion.div>

    {/* Handbag - Bottom Right */}
    <motion.div
      animate={{ y: [0, 20, 0], rotate: [0, 8, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      className="absolute bottom-0 right-10 w-64 h-64 opacity-90 will-change-transform"
    >
      <div className="w-full h-full relative bg-white/50 backdrop-blur-sm p-4 shadow-sm border border-primary/5">
        <Image src="/assets/designer_handbag.png" alt="Designer Handbag" fill sizes="300px" quality={100} className="object-contain drop-shadow-xl p-4" />
      </div>
    </motion.div>
  </>
);

/* =========================================
   MAIN PAGE
   ========================================= */

export default function WaitlistPage() {
  const { t, locale, setLocale } = useTranslation();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const [recentNames, setRecentNames] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      const count = await getWaitlistCount();
      const names = await getRecentWaitlistNames();
      // Add a base number of 241 just to make it look hype immediately, 
      // but in real life you could just use 'count' directly if the table has enough entries.
      setWaitlistCount(count);
      setRecentNames(names);
    }
    fetchData();
  }, []);

  async function handleSubmit(formData: FormData) {
    setStatus("loading");
    setErrorMessage("");

    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    // Regex Checks
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid phone number (at least 10 digits).");
      setStatus("error");
      return;
    }

    const result = await joinWaitlist(formData);

    if (result?.error) {
      setErrorMessage(result.error);
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  return (
    <main className="relative min-h-screen bg-background overflow-x-hidden selection:bg-primary selection:text-on-primary pb-32">

      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <Logo className="text-2xl" />
        <div className="flex items-center space-x-4 mr-4">
          <LiveSignupsTicker names={recentNames} />
          <button
            onClick={() => setLocale(locale === 'en' ? 'ur' : 'en')}
            className="font-bold text-[10px] px-3 border-2 border-primary/20 text-primary rounded-full hover:bg-primary/5 transition-colors h-[32px] flex items-center justify-center cursor-pointer shrink-0"
          >
            {locale === 'en' ? 'UR' : 'EN'}
          </button>
        </div>
      </nav>

      {/* Hero Section (2-Column Grid) */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-20 md:pt-20 pb-20 flex flex-col md:flex-row items-center justify-between gap-12">

        {/* Left Column: Text */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-start w-full md:w-1/2 text-left">

          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-[11.5px] uppercase tracking-[0.2em] var(--font-editorial-sans) text-primary/60 mb-6 font-bold"
          >
            PRELOVED FASHION · PAKISTAN
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-[48px] md:text-[102px] leading-[1.1] var(--font-editorial-serif) font-medium text-primary mb-0"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Buy. Sell.
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="text-[48px] md:text-[102px] leading-[1.1] var(--font-editorial-serif) font-medium text-primary/70 italic mb-8"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Browse.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }}
            className="text-[16px] md:text-[20px] font-light text-primary/80 mb-10 max-w-md leading-relaxed tracking-wide"
            style={{ fontFamily: 'var(--font-jost)' }}
          >
            Curated pre-loved pieces, rotated with ease. Zero fees, high aesthetic — a marketplace for fashion lovers.
          </motion.p>

          {/* Mobile Only Parallax Images (Above Buttons) */}
          <div className="md:hidden w-full relative h-[350px] mb-8 pointer-events-none scale-75 sm:scale-90 origin-top">
            <ParallaxImages />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="w-full max-w-md flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => document.getElementById("waitlist-form")?.scrollIntoView({ behavior: "smooth" })}
              className="relative w-full sm:w-[50%] h-[56px] rounded-none overflow-hidden group active:scale-95 transition-all duration-300 bg-primary"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out z-0" />
              <div className="relative z-10 flex items-center justify-center w-full h-full text-on-primary font-bold text-[12px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jost)' }}>
                Join the Waitlist
              </div>
            </button>
            <Link href="/how-it-works" className="w-full sm:w-[50%] h-[56px] flex items-center justify-center rounded-none border-[1.5px] border-primary text-primary font-bold text-[12px] uppercase tracking-widest hover:bg-primary/5 transition-colors" style={{ fontFamily: 'var(--font-jost)' }}>
              How it Works
            </Link>
          </motion.div>

          {/* Social Proof Count */}
          {waitlistCount >= 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
              className="mt-6 flex items-center space-x-3 text-primary/70 font-medium"
            >
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-primary-container flex items-center justify-center shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-primary/20 flex items-center justify-center shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </div>
                {waitlistCount >= 1000 ? (
                  <div className="w-8 h-8 rounded-full border-2 border-surface bg-primary flex items-center justify-center shadow-sm text-[10px] text-on-primary font-bold">
                    +{waitlistCount}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-surface bg-primary flex items-center justify-center shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  </div>
                )}
              </div>
              <span className="text-sm max-w-[250px] leading-snug">
                {waitlistCount < 1000 ? (
                  <>Join other fashion lovers for <strong className="text-primary">exclusive access</strong> & opening discounts.</>
                ) : (
                  <>Join <strong className="text-primary font-extrabold">{waitlistCount}</strong> fashion lovers</>
                )}
              </span>
            </motion.div>
          )}

        </motion.div>

        {/* Right Column: Parallax Images */}
        <div className="w-full md:w-1/2 relative h-[400px] md:h-[500px] mt-12 md:mt-0 hidden md:block pointer-events-none scale-75 sm:scale-90 md:scale-100 origin-top">
          <ParallaxImages />
        </div>
      </div>

      {/* About Section for Pakistan */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 text-left">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="w-full relative flex flex-col md:flex-row gap-12"
        >
          <div className="w-full md:w-1/2">
            <h2 className="text-[32px] md:text-[54px] leading-[1.1] var(--font-editorial-serif) font-medium text-primary tracking-tight sticky top-24" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Redefining Thrift in Pakistan.
            </h2>
          </div>

          <div className="w-full md:w-1/2 space-y-6 text-lg md:text-[20px] text-primary/80 font-light leading-relaxed tracking-wide" style={{ fontFamily: 'var(--font-jost)' }}>
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
              }}
            >
              Pakistan's fashion landscape is vibrant, but letting go of great clothes shouldn't be complicated or expensive. We noticed a huge gap: there is no aesthetic, dedicated, and truly free platform to rotate your wardrobe.
            </motion.p>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
              }}
            >
              That's why we're building Curio. A marketplace designed for fashion lovers, where you can buy and sell premium pre-loved clothing directly to each other. <strong className="font-medium">No hidden cuts, no massive commission fees, no middlemen.</strong>
            </motion.p>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
              }}
              className="var(--font-editorial-serif) font-medium text-primary text-[24px] md:text-[32px] pt-4 italic" style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Just pure style, sustainably shared.
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* Form Section */}
      <div id="waitlist-form" className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 flex flex-col items-start">

        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col md:flex-row gap-12 relative overflow-hidden"
          >
            <div className="w-full md:w-1/2">
              <h2 className="text-[32px] md:text-[54px] leading-[1.1] var(--font-editorial-serif) font-medium text-primary mb-6 tracking-tight sticky top-24" style={{ fontFamily: 'var(--font-cormorant)' }}>
                You're on the list!
              </h2>
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-start">
              <p className="text-primary/70 font-light max-w-md mb-10 text-left text-[16px] md:text-[20px] leading-relaxed tracking-wide" style={{ fontFamily: 'var(--font-jost)' }}>
                Keep an eye on your inbox. We'll let you know the moment you can turn your closet into cash.
              </p>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="h-[56px] px-10 bg-white text-primary border border-primary font-bold rounded-none hover:bg-primary/5 transition-all active:scale-95 text-[12px] uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-jost)' }}
              >
                Back to Top
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full flex flex-col md:flex-row gap-12 relative"
          >
            <div className="w-full md:w-1/2">
              <h3 className="text-[32px] md:text-[54px] leading-[1.1] var(--font-editorial-serif) font-medium text-primary mb-8 relative z-10 text-left sticky top-24" style={{ fontFamily: 'var(--font-cormorant)' }}>
                Secure your spot <br /><span className="italic text-primary/70">in line.</span>
              </h3>
            </div>

            <div className="w-full md:w-1/2">
              <form
                action={handleSubmit}
                className="w-full max-w-md flex flex-col gap-5 relative z-10"
              >
                <ShinyInput label="Full Name" name="name" type="text" placeholder="" disabled={status === "loading"} />
                <ShinyInput label="Email Address" name="email" type="email" placeholder="" disabled={status === "loading"} />
                <ShinyInput label="Phone Number" name="phone" type="tel" placeholder="" disabled={status === "loading"} />
                <ShinySelect
                  label="What will you use Curio for?"
                  name="intent"
                  options={["Buying", "Selling", "Browsing", "All of the above"]}
                  disabled={status === "loading"}
                />

                {errorMessage && (
                  <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 font-bold text-sm text-center mt-1">
                    {errorMessage}
                  </motion.p>
                )}

                <SweepButton disabled={status === "loading"} loading={status === "loading"}>
                  Submit Details
                </SweepButton>
              </form>

              <p className="mt-8 text-[13px] text-primary/50 font-medium relative z-10">
                We promise to keep your data safe.
              </p>
            </div>
          </motion.div>
        )}
      </div>
      <div className="relative z-50 w-full bg-white">
        <Footer />
      </div>
    </main>
  );
}
