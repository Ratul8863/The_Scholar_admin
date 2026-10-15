import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <article className="stat-card">
      <p className="type-14">{label}</p>
      <p className="type-32 num">{value}</p>
      {hint ? <p className="type-14">{hint}</p> : null}
    </article>
  );
}

export function SummaryCard({
  title,
  children,
  action,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("warm-panel", className)}>
      {title ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="warm-sheet min-w-0 [overflow-wrap:anywhere]">{children}</div>
    </section>
  );
}

export function ContentCard({
  title,
  children,
  action,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("warm-sheet", className)}>
      {title ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="min-w-0 [overflow-wrap:anywhere]">{children}</div>
    </section>
  );
}

export function NavigationCard({
  href,
  eyebrow,
  title,
  description,
  meta,
}: {
  href: string;
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: React.ReactNode;
}) {
  return (
    <Link href={href} className="action-card">
      <span className="min-w-0">
        {eyebrow ? <span className="type-14">{eyebrow}</span> : null}
        <h2 className="type-18">{title}</h2>
        {description ? <span className="type-16 mt-1 block text-muted">{description}</span> : null}
        {meta ? <span className="type-14 num mt-2 block">{meta}</span> : null}
      </span>
      <span className="icon-circle-ink" aria-hidden>
        <ChevronRight className="nav-arrow h-4 w-4" />
      </span>
    </Link>
  );
}

export function RecordCard({
  href,
  title,
  meta,
  children,
}: {
  href?: string;
  title: string;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <span className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="type-18 block">{title}</span>
          {meta ? <span className="type-14 mt-1 block">{meta}</span> : null}
        </span>
      </span>
      {href ? (
        <span className="icon-circle-ink" aria-hidden>
          <ChevronRight className="nav-arrow h-4 w-4" />
        </span>
      ) : null}
      {children ? <div className="type-16 mt-3 w-full">{children}</div> : null}
    </>
  );
  if (!href) return <article className="warm-sheet">{body}</article>;
  return (
    <Link href={href} className="action-card flex-wrap">
      {body}
    </Link>
  );
}

export function AlertCard({
  tone = "warning",
  title,
  children,
  action,
  href,
}: {
  tone?: "neutral" | "info" | "warning" | "danger";
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className={cn("section-title", tone === "danger" && "text-danger", tone === "warning" && "text-warning")}>{title}</h2>
        {action}
      </div>
      {children ? <div className="type-16 mt-3">{children}</div> : null}
    </>
  );
  if (href) return <Link href={href} className="alert-card is-pressable" data-tone={tone}>{body}</Link>;
  return <section className="alert-card" data-tone={tone}>{body}</section>;
}
