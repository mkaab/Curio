"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LiveSignupsTicker({ names = [] }: { names?: string[] }) {
  // Dummy fallback if db is empty so it still looks alive
  const defaultNames = ["Ahmed", "Sara", "Ali", "Fatima", "Hassan", "Zainab"];
  const activeNames = names && names.length > 0 ? names : defaultNames;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeNames.length);
    }, 4000); // cycle every 4 seconds

    return () => clearInterval(interval);
  }, [activeNames.length]);

  return (
    <div className="hidden md:flex items-center space-x-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 min-w-[240px] h-[36px] overflow-hidden relative">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
      <div className="relative w-full h-full flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            className="absolute inset-0 flex items-center"
          >
            <p className="text-xs font-bold text-primary truncate">
              {activeNames[currentIndex]} just joined!
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
