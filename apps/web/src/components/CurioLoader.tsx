import React from "react";

interface CurioLoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export function CurioLoader({ label, fullScreen = true }: CurioLoaderProps) {
  const loader = (
    <div className="flex flex-col items-center justify-center gap-3 select-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 28 28"
        fill="none"
        className="h-12 w-12 text-primary overflow-visible"
        aria-label="Loading"
        role="status"
      >
        <style>{`
          @keyframes curio-spin-morph {
            0% {
              stroke-dasharray: 12 36;
              transform: rotate(0deg);
            }
            40% {
              stroke-dasharray: 44 4;
              transform: rotate(360deg);
            }
            65% {
              stroke-dasharray: 44 4;
              transform: rotate(360deg);
            }
            100% {
              stroke-dasharray: 12 36;
              transform: rotate(720deg);
            }
          }
          @keyframes curio-handle-draw {
            0%, 32% {
              stroke-dashoffset: 12;
              opacity: 0;
            }
            48%, 68% {
              stroke-dashoffset: 0;
              opacity: 1;
            }
            84%, 100% {
              stroke-dashoffset: 12;
              opacity: 0;
            }
          }
          .curio-lens {
            transform-origin: 12px 12px;
            animation: curio-spin-morph 2.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
          }
          .curio-handle {
            stroke-dasharray: 12;
            animation: curio-handle-draw 2.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
          }
        `}</style>
        {/* Subtle static track */}
        <circle
          cx="12"
          cy="12"
          r="7"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="2.5"
        />
        {/* Spinning arc that closes into the magnifying glass lens */}
        <circle
          cx="12"
          cy="12"
          r="7"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          className="curio-lens"
        />
        {/* Magnifying glass handle drawing in when lens closes */}
        <line
          x1="17.2"
          y1="17.2"
          x2="24"
          y2="24"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          className="curio-handle"
        />
      </svg>
      {label && (
        <p className="text-[11px] text-surface-tint font-semibold tracking-[0.2em] uppercase">
          {label}
        </p>
      )}
    </div>
  );

  if (!fullScreen) return loader;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      {loader}
    </div>
  );
}
