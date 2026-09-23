export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container border-t-primary" />
        <p className="text-sm text-surface-tint font-medium tracking-wide uppercase">Loading...</p>
      </div>
    </main>
  );
}
