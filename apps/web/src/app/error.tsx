"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-serif font-semibold text-on-surface mb-2">Something went wrong</h2>
          <p className="text-sm text-surface-tint">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
        <button
          onClick={reset}
          className="bg-primary text-on-primary font-bold h-11 px-8 text-sm rounded-full shadow-md hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
