import Link from "next/link";
import React from "react";

export const Logo = ({ className = "text-2xl", colorClass = "text-primary" }: { className?: string, colorClass?: string }) => {
  return (
    <Link href="/" className="flex items-center group select-none hover:opacity-90 transition-opacity">
      <div className={`font-serif font-bold ${colorClass} tracking-tight flex items-center ${className}`}>
        CURI
        <div className="relative flex items-center justify-center">
          O
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={`absolute ${colorClass} w-[0.40em] h-[0.40em]`}
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <circle cx="12" cy="12" r="6.5" />
            <line x1="16.6" y1="16.6" x2="23" y2="23" />
          </svg>
        </div>
      </div>
    </Link>
  );
};
