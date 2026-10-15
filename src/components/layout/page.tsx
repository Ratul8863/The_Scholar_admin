import Link from "next/link";
import { cn } from "@/lib/utils";
import { ContentCard } from "@/components/ui/card";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-muted">{eyebrow}</p> : null}
        <h1 className="text-[1.5rem] font-normal leading-8 tracking-tight text-primary sm:text-[1.75rem] lg:text-[2rem] lg:leading-10">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-muted sm:text-[15px]">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function SectionCard({ title, children, action, className }: { title?: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return <ContentCard title={title} action={action} className={className}>{children}</ContentCard>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[16px] border border-dashed border-line bg-white px-4 py-10 text-center">
      <h2 className="text-lg font-normal tracking-tight">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Pager({ page, pages, path, query }: { page: number; pages: number; path: string; query: Record<string, string | undefined> }) {
  function href(next: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
    params.set("page", String(next));
    return `${path}?${params.toString()}`;
  }
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
      <span className="num">Page {page} of {pages}</span>
      <div className="flex gap-2">
        {page > 1 ? <Link className="inline-flex h-11 items-center rounded-full border border-line bg-white px-3.5 text-ink transition-colors duration-[180ms] hover:border-line-strong hover:bg-primary-soft" href={href(page - 1)}>Previous</Link> : null}
        {page < pages ? <Link className={cn("inline-flex h-11 items-center rounded-full border border-line bg-white px-3.5 text-ink transition-colors duration-[180ms] hover:border-line-strong hover:bg-primary-soft")} href={href(page + 1)}>Next</Link> : null}
      </div>
    </div>
  );
}
