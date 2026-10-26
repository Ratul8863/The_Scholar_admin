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
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="type-14 mb-1">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="type-16 mt-2 max-w-3xl text-muted">{description}</p> : null}
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
    <div className="warm-sheet text-center">
      <h2 className="section-title">{title}</h2>
      <p className="type-16 mx-auto mt-2 max-w-md text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Pager({
  page,
  pages,
  path,
  query,
  hasMore,
}: {
  page: number;
  pages?: number;
  path: string;
  query: Record<string, string | undefined>;
  hasMore?: boolean;
}) {
  function href(next: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
    params.set("page", String(next));
    return `${path}?${params.toString()}`;
  }
  const showNext = hasMore === true || (hasMore !== false && pages != null && page < pages);
  if (page <= 1 && !showNext) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
      <span className="type-14 num">Page {page}{pages && hasMore === undefined ? ` of ${pages}` : ""}</span>
      <div className="flex gap-2">
        {page > 1 ? <Link className="nav-pill" href={href(page - 1)}>Previous</Link> : null}
        {showNext ? <Link className={cn("nav-pill")} href={href(page + 1)}>Next</Link> : null}
      </div>
    </div>
  );
}
