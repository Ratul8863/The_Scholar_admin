import Link from "next/link";
import { contentWorkspace } from "@/server/services/content";
import { getCurrentUser, can } from "@/server/auth/current-user";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { AlertCard, MetricCard } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { titleCaseStatus } from "@/lib/utils";

export default async function ContentPage() {
  const user = await getCurrentUser();
  const data = await contentWorkspace(user);
  return (
    <div className="space-y-4">
      <PageHeader title="Content workspace" description="Emergency information, deadlines, new research, and publish-ready work in one queue. Publishing stays an explicit action." />
      <AlertCard tone="danger" title="Emergency upload" action={<Button asChild variant="outline" size="sm"><Link href="/emergency">Open emergency desk</Link></Button>}>
        <ul className="mt-3 space-y-2">
          {data.emergency.length === 0 ? <li className="text-sm text-ink">No emergency or recent news items are waiting.</li> : null}
          {data.emergency.map((item) => (
            <li key={String(item.id)} className="rounded-xl bg-white px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link className="font-medium" href={`/emergency/${item.id}`}>{String(item.title)}</Link>
                <Badge tone={statusTone(String(item.urgency))}>{String(item.urgency)}</Badge>
                <span className="text-xs text-muted">{String(item.informationType)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{String(item.sourceName || "Source not named")} · {item.createdAt ? new Date(String(item.createdAt)).toLocaleDateString() : ""}</p>
            </li>
          ))}
        </ul>
      </AlertCard>
      <SectionCard title="Upcoming deadlines">
        <DeadlineList rows={data.deadlines.slice(0, 8)} />
      </SectionCard>
      <SectionCard title="Application starting soon">
        <ul className="space-y-2 text-sm">
          {data.opening.length === 0 ? <li className="text-muted">No opening dates in the configured window.</li> : null}
          {data.opening.map((item) => (
            <li key={String(item.id)} className="flex justify-between gap-3"><span>{String(item.label)}</span><span className="num text-muted">{String(item.daysUntilOpening ?? "—")} days</span></li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Newly uploaded information">
        <ul className="space-y-2 text-sm">
          {data.fresh.length === 0 ? <li className="text-muted">Nothing new in the recent window.</li> : null}
          {data.fresh.map((item) => <li key={`${item.type}-${item.id}`}><Link className="text-primary" href={item.href}>{item.title}</Link> <span className="text-muted">{item.type}</span></li>)}
        </ul>
      </SectionCard>
      <SectionCard title="In progress" action={can(user, "content.create") ? <Button asChild variant="outline" size="sm"><Link href="/content/new">Create content</Link></Button> : null}>
        <ul className="space-y-2 text-sm">
          {data.inProgress.length === 0 ? <li className="text-muted">New content starts here, before it is ready to publish.</li> : null}
          {data.inProgress.map((item) => <li key={String(item.id)} className="flex flex-wrap items-center justify-between gap-2"><Link className="font-medium text-primary" href={`/content/${item.id}`}>{String(item.title)}</Link><Badge tone={statusTone(String(item.contentStatus))}>{titleCaseStatus(String(item.contentStatus))}</Badge></li>)}
        </ul>
      </SectionCard>
      <SectionCard title="Ready to publish">
        <ul className="space-y-2 text-sm">
          {data.readyToPublish.length === 0 ? <li className="text-muted">Nothing is waiting for an explicit publish.</li> : null}
          {data.readyToPublish.map((item) => <li key={String(item.id)}><Link className="font-medium text-primary" href={`/content/${item.id}`}>{String(item.title)}</Link></li>)}
        </ul>
      </SectionCard>
      <SectionCard title="Published">
        <ul className="space-y-2 text-sm">
          {data.published.length === 0 ? <li className="text-muted">Published items will be listed here.</li> : null}
          {data.published.map((item) => <li key={String(item.id)} className="flex justify-between"><Link href={`/content/${item.id}`}>{String(item.title)}</Link><span className="text-muted">{item.publishedDate ? new Date(String(item.publishedDate)).toLocaleDateString() : ""}</span></li>)}
        </ul>
      </SectionCard>
      <SectionCard title="Content productivity">
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(data.productivity).map(([status, count]) => <MetricCard key={status} label={titleCaseStatus(status)} value={count} />)}
        </div>
      </SectionCard>
    </div>
  );
}

function DeadlineList({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <p className="text-sm text-muted">No upcoming dated deadlines are stored.</p>;
  return (
    <ul className="space-y-2 text-sm">
      {rows.map((row) => (
        <li key={String(row.id)} className="flex flex-wrap items-center justify-between gap-2">
          <span>{String(row.label)}</span>
          <span className="flex items-center gap-2"><Badge tone={statusTone(String(row.state))}>{String(row.state).replaceAll("_", " ")}</Badge><span className="num text-muted">{String(row.daysRemaining ?? "—")}</span></span>
        </li>
      ))}
    </ul>
  );
}
