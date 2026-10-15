import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { interactiveCard, panelClass } from "@/components/ui/styles";

const shells = {
  compact: "rounded-[12px] border border-line bg-white shadow-[var(--shadow-soft)]",
  standard: panelClass,
  feature: "rounded-[20px] border border-line bg-white shadow-[var(--shadow-soft)]",
} as const;

export function MetricCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <article className={cn(shells.compact, "px-4 py-3")}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="num mt-1 text-[1.75rem] font-medium leading-none tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
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
    <section className={cn(shells.feature, className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-lg font-normal tracking-tight text-ink sm:text-xl">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="min-w-0 p-5 text-sm [overflow-wrap:anywhere]">{children}</div>
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
    <section className={cn(shells.standard, className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="text-lg font-normal tracking-tight text-ink">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="min-w-0 p-4 [overflow-wrap:anywhere] sm:p-5">{children}</div>
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
    <Link href={href} className={cn(shells.standard, interactiveCard, "group flex items-start justify-between gap-3 p-4 sm:p-5")}>
      <span className="min-w-0">
        {eyebrow ? <span className="block text-xs font-medium text-muted">{eyebrow}</span> : null}
        <h2 className="text-lg font-normal tracking-tight text-ink transition-colors duration-[180ms] group-hover:text-primary">{title}</h2>
        {description ? <span className="mt-1 block text-sm leading-6 text-muted">{description}</span> : null}
        {meta ? <span className="num mt-2 block text-sm text-muted">{meta}</span> : null}
      </span>
      <span className="press-mark mt-0.5" aria-hidden>
        <ChevronRight className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-[180ms] motion-safe:group-hover:translate-x-1" />
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
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block font-medium text-ink transition-colors duration-[180ms] group-hover:text-primary">{title}</span>
          {meta ? <span className="mt-0.5 block text-sm text-muted">{meta}</span> : null}
        </span>
        {href ? (
          <span className="press-mark" aria-hidden>
            <ChevronRight className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-[180ms] motion-safe:group-hover:translate-x-1" />
          </span>
        ) : null}
      </span>
      {children ? <div className="mt-2 text-sm">{children}</div> : null}
    </>
  );
  if (!href) return <article className={cn(shells.compact, "p-4")}>{body}</article>;
  return <Link href={href} className={cn(shells.compact, interactiveCard, "group block p-4")}>{body}</Link>;
}

const alertTones = {
  neutral: "border-line bg-white text-ink",
  info: "border-info/20 bg-info-soft text-ink",
  warning: "border-warning/30 bg-warning-soft text-ink",
  danger: "border-danger/30 bg-danger-soft text-ink",
} as const;

export function AlertCard({
  tone = "warning",
  title,
  children,
  action,
  href,
}: {
  tone?: keyof typeof alertTones;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
}) {
  const className = cn("rounded-[16px] border p-4 sm:p-5", alertTones[tone], href && interactiveCard, href && "group block");
  const body = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className={cn("text-lg font-normal tracking-tight", tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-ink")}>{title}</h2>
        {action}
      </div>
      {children ? <div className="mt-3 text-sm">{children}</div> : null}
    </>
  );
  if (href) return <Link href={href} className={className}>{body}</Link>;
  return <section className={className}>{body}</section>;
}
