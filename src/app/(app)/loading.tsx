export default function Loading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-line" />
      <div className="h-24 animate-pulse rounded-[16px] bg-white" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className="h-20 animate-pulse rounded-[12px] bg-white" />
        <div className="h-20 animate-pulse rounded-[12px] bg-white" />
        <div className="hidden h-20 animate-pulse rounded-[12px] bg-white md:block" />
      </div>
    </div>
  );
}
