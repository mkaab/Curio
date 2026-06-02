"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, useAnimation, useInView, Variants } from "framer-motion";
import { joinWaitlist, getWaitlistCount } from "./actions";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

/* =========================================
   PREMIUM CULT UI / SKIPER UI COMPONENTS
   ========================================= */

// 1. Text Reveal Component (Magic Animator style)
function TextReveal({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <motion.h1
      className={cn("flex flex-wrap justify-center overflow-hidden", className)}
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.08 } },
        hidden: {},
      }}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className={cn(
              "inline-block", 
              word.toLowerCase().includes("pre-loved") && "italic bg-[#00754A] text-white px-4 py-0.5 rounded-xl shadow-lg"
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
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00754A]/30 to-transparent opacity-0 group-focus-within:opacity-100 group-hover:opacity-50 blur-sm transition-opacity duration-500 animate-[spin_4s_linear_infinite]" />

        <input
          type={type}
          name={name}
          required
          disabled={disabled}
          placeholder={placeholder}
          className="relative w-full h-14 bg-white/70 backdrop-blur-md px-5 rounded-2xl text-[16px] text-black placeholder:text-black/30 outline-none border border-white/50 focus:bg-white focus:shadow-[0_0_20px_rgba(0,117,74,0.1)] transition-all z-10"
        />
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
      className="relative w-full h-[56px] mt-4 rounded-full overflow-hidden group active:scale-95 transition-all duration-300 shadow-[0_0_15px_rgba(0,117,74,0.2)] hover:shadow-[0_0_30px_rgba(0,117,74,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <div className="absolute inset-0 bg-[#00754A] transition-colors z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out z-0" />
      <div className="relative z-10 flex items-center justify-center w-full h-full text-white font-bold text-[16px]">
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

/* =========================================
   MAIN PAGE
   ========================================= */

export default function WaitlistPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [waitlistCount, setWaitlistCount] = useState<number>(0);

  useEffect(() => {
    async function fetchCount() {
      const count = await getWaitlistCount();
      // Add a base number of 241 just to make it look hype immediately, 
      // but in real life you could just use 'count' directly if the table has enough entries.
      setWaitlistCount(count);
    }
    fetchCount();
  }, []);

  async function handleSubmit(formData: FormData) {
    setStatus("loading");
    setErrorMessage("");

    const result = await joinWaitlist(formData);

    if (result?.error) {
      setErrorMessage(result.error);
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  return (
    <main className="relative min-h-screen bg-[#f2f0eb] overflow-x-hidden selection:bg-[#00754A] selection:text-white pb-32">

      {/* Aurora Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#f2f0eb] z-0" />
        <motion.div
          animate={{ x: ["0%", "10%", "-10%", "0%"], y: ["0%", "-10%", "10%", "0%"], scale: [1, 1.2, 0.8, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-[#d4e9e2] to-[#edebe9] blur-[100px] opacity-70 mix-blend-multiply"
        />
        <motion.div
          animate={{ x: ["0%", "-15%", "15%", "0%"], y: ["0%", "15%", "-15%", "0%"], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute top-[30%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-white to-[#00754A]/10 blur-[120px] opacity-60 mix-blend-multiply"
        />
      </div>

      {/* Better Spaced Parallax Fashion Items (Now fixed across the viewport) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Sneaker - Top Left */}
        <motion.div
          animate={{ y: [0, -30, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[8%] md:left-[12%] w-32 h-32 md:w-56 md:h-56 opacity-80"
        >
          <Image src="/assets/vintage_sneaker.png" alt="Vintage Sneaker" fill className="object-contain drop-shadow-2xl mix-blend-multiply" />
        </motion.div>

        {/* Sunglasses - Top Right */}
        <motion.div
          animate={{ y: [0, 35, 0], rotate: [0, 12, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-[25%] right-[8%] md:right-[15%] w-24 h-24 md:w-40 md:h-40 opacity-70"
        >
          <Image src="/assets/chic_sunglasses.png" alt="Chic Sunglasses" fill className="object-contain drop-shadow-xl mix-blend-multiply" />
        </motion.div>

        {/* Denim Jacket - Middle Left */}
        <motion.div
          animate={{ y: [0, -25, 0], x: [0, 10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[50%] left-[5%] md:left-[10%] w-32 h-32 md:w-48 md:h-48 opacity-50"
        >
          <Image src="/assets/vintage_denim_jacket.png" alt="Denim Jacket" fill className="object-contain drop-shadow-xl mix-blend-multiply" />
        </motion.div>

        {/* Handbag - Bottom Right */}
        <motion.div
          animate={{ y: [0, 40, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[10%] right-[5%] md:right-[12%] w-32 h-32 md:w-64 md:h-64 opacity-70"
        >
          <Image src="/assets/designer_handbag.png" alt="Designer Handbag" fill className="object-contain drop-shadow-2xl mix-blend-multiply" />
        </motion.div>
      </div>

      {/* Navbar */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <Link href="/" className="flex items-center space-x-2 cursor-pointer group">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#006241] flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-110 transition-transform">C</div>
          <span className="text-2xl font-bold text-[#006241] uppercase tracking-wider hidden sm:block">Curio</span>
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-20 md:pt-28 pb-20 flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-center w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-block px-4 py-1.5 mb-8 text-[12px] font-bold tracking-[0.15em] text-[#00754A] uppercase bg-white/80 backdrop-blur-md rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            Coming Soon
          </motion.div>

          <TextReveal
            text="The easiest way to buy & sell pre-loved fashion."
            className="text-[32px] md:text-[54px] md:leading-[1.2] font-extrabold uppercase text-[#1E3932] mb-6 tracking-wide drop-shadow-sm max-w-3xl"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }}
            className="text-lg md:text-xl text-[#1E3932]/70 font-medium mb-10 max-w-md leading-relaxed tracking-tight"
          >
            Zero fees. High aesthetic. Join the exclusive waitlist today.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="w-full max-w-sm">
            <button
              onClick={() => document.getElementById("waitlist-form")?.scrollIntoView({ behavior: "smooth" })}
              className="relative w-full h-[56px] rounded-full overflow-hidden group active:scale-95 transition-all duration-300 shadow-[0_0_15px_rgba(0,117,74,0.2)] hover:shadow-[0_0_30px_rgba(0,117,74,0.4)]"
            >
              <div className="absolute inset-0 bg-[#00754A] transition-colors z-0" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out z-0" />
              <div className="relative z-10 flex items-center justify-center w-full h-full text-white font-bold text-[16px]">
                Join Exclusive Waitlist
              </div>
            </button>
          </motion.div>

          {/* Social Proof Count */}
          {waitlistCount >= 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} 
              className="mt-6 flex items-center space-x-3 text-[#1E3932]/70 font-medium"
            >
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-[#f2f0eb] bg-[#d4e9e2] flex items-center justify-center shadow-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#00754A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#f2f0eb] bg-[#00754A]/20 flex items-center justify-center shadow-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#00754A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#f2f0eb] bg-[#00754A] flex items-center justify-center shadow-sm text-[10px] text-white font-bold">
                  +{waitlistCount}
                </div>
              </div>
              <span className="text-sm">Join <strong className="text-[#00754A] font-extrabold">{waitlistCount + 42}</strong> fashion lovers</span>
            </motion.div>
          )}

        </motion.div>
      </div>

      {/* About Section for Pakistan */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 py-20 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 40, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="bg-white/40 backdrop-blur-3xl p-10 md:p-16 rounded-[40px] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden"
        >
          {/* Subtle gradient glow inside the card */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.2 } },
              hidden: {},
            }}
            className="relative z-10"
          >
            <TextReveal 
              text="Redefining Thrift in Pakistan." 
              className="text-3xl md:text-4xl font-extrabold text-[#1E3932] mb-8 tracking-tight justify-center"
            />
            
            <div className="space-y-6 text-lg md:text-xl text-[#1E3932]/80 font-medium leading-relaxed">
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
                That's why we're building Curio. A marketplace designed for fashion lovers, where you can buy and sell premium pre-loved clothing directly to each other. <strong>No hidden cuts, no massive commission fees, no middlemen.</strong>
              </motion.p>
              
              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
                }}
                className="font-bold text-[#00754A] text-xl md:text-2xl pt-4"
              >
                Just pure style, sustainably shared.
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Form Section */}
      <div id="waitlist-form" className="relative z-10 w-full max-w-xl mx-auto px-6 py-20 flex flex-col items-center">

        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-3xl border border-white p-10 rounded-[32px] shadow-2xl flex flex-col items-center w-full relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#00754A]/5 to-transparent pointer-events-none" />
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, -10, 0] }} transition={{ type: "spring", bounce: 0.6 }}
              className="w-24 h-24 bg-gradient-to-br from-[#00754A] to-[#006241] rounded-full flex items-center justify-center mb-6 shadow-xl shadow-[#00754A]/40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h2 className="text-4xl font-extrabold text-[#1E3932] mb-3 tracking-tight">You're on the list!</h2>
            <p className="text-[#1E3932]/70 font-medium max-w-sm mb-8 text-center text-lg leading-relaxed">
              Keep an eye on your inbox. We'll let you know the moment you can turn your closet into cash.
            </p>
            <Link href="/">
              <button className="h-14 px-10 bg-white text-[#00754A] border-2 border-[#00754A] font-bold rounded-full hover:bg-[#00754A] hover:text-white transition-all w-full active:scale-95 shadow-md">
                Back to Curio
              </button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full flex flex-col items-center"
          >
            <h3 className="text-2xl font-bold text-[#1E3932] mb-8">Secure your spot in line.</h3>

            <form
              action={handleSubmit}
              className="w-full bg-white/40 backdrop-blur-3xl p-6 md:p-8 rounded-[36px] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col gap-5 relative"
            >
              <ShinyInput label="Full Name" name="name" type="text" placeholder="Jane Doe" disabled={status === "loading"} />
              <ShinyInput label="Email Address" name="email" type="email" placeholder="jane@example.com" disabled={status === "loading"} />
              <ShinyInput label="Phone Number" name="phone" type="tel" placeholder="+92 300 0000000" disabled={status === "loading"} />

              {errorMessage && (
                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 font-bold text-sm text-center mt-1">
                  {errorMessage}
                </motion.p>
              )}

              <SweepButton disabled={status === "loading"} loading={status === "loading"}>
                Submit Details
              </SweepButton>
            </form>

            <p className="mt-8 text-[13px] text-[#1E3932]/50 font-medium">
              We promise to keep your data safe.
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
