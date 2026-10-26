export default function Loading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <div className="h-12 w-full max-w-64 animate-pulse rounded-full bg-[var(--sand)]" />
      <div className="stat-card h-28 animate-pulse" />
      <div className="overview-stats">
        <div className="stat-card h-24 animate-pulse" />
        <div className="stat-card h-24 animate-pulse" />
        <div className="stat-card hidden h-24 animate-pulse sm:block" />
      </div>
    </div>
  );
}
