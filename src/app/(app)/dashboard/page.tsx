import Link from "next/link";
import { dashboardData } from "@/server/services/dashboard";
import { userLookup } from "@/server/services/query";
import { PageHeader } from "@/components/layout/page";
import { MetricCard, SummaryCard } from "@/components/ui/card";
import { titleCaseStatus } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await dashboardData();
  const users = await userLookup(data.workload.map((item) => item.userId));
  const metrics = [
    ["Scholarships", data.metrics.scholarships],
    ["Universities", data.metrics.universities],
    ["Professors", data.metrics.professors],
    ["Countries", data.metrics.countries],
    ["Opportunities", data.metrics.opportunities],
    ["Content", data.metrics.content],
    ["Published", data.metrics.published],
    ["Ready to publish", data.metrics.readyToPublish],
    ["Emergency uploads", data.metrics.emergencies],
  ];
  return (
    <div>
      <PageHeader eyebrow="Today" title="Operating picture" description="Counts, deadlines, and recent changes come from the database. Empty numbers mean the team has not entered that research yet." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map(([label, value]) => (
          <MetricCard key={String(label)} label={String(label)} value={value} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SummaryCard title="Deadlines">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted">Next 5 days</dt><dd className="num text-lg">{data.buckets.next5}</dd></div>
            <div><dt className="text-muted">Next 7 days</dt><dd className="num text-lg">{data.buckets.next7}</dd></div>
            <div><dt className="text-muted">Next 30 days</dt><dd className="num text-lg">{data.buckets.next30}</dd></div>
            <div><dt className="text-muted">Next 60 days</dt><dd className="num text-lg">{data.buckets.next60}</dd></div>
          </dl>
          <Link className="mt-3 inline-block text-sm font-medium text-primary transition-colors duration-[180ms] hover:text-primary-dark" href="/deadlines">Open deadline intelligence</Link>
        </SummaryCard>
        <SummaryCard title="Content workflow">
          <ul className="space-y-1 text-sm">
            {Object.keys(data.contentCounts).length === 0 ? <li className="text-muted">No content records yet.</li> : null}
            {Object.entries(data.contentCounts).map(([status, count]) => (
              <li key={status} className="flex justify-between"><span>{titleCaseStatus(status)}</span><span className="num">{count}</span></li>
            ))}
          </ul>
        </SummaryCard>
        <SummaryCard title="Recent activity">
          <ul className="space-y-2 text-sm">
            {data.activity.length === 0 ? <li className="text-muted">Changes will appear here after the team starts working.</li> : null}
            {data.activity.map((item) => (
              <li key={String(item.id)} className="flex justify-between gap-3">
                <span>{titleCaseStatus(String(item.action))} {String(item.entityType)}</span>
                <time className="text-muted">{item.timestamp ? new Date(String(item.timestamp)).toLocaleString() : ""}</time>
              </li>
            ))}
          </ul>
        </SummaryCard>
        <SummaryCard title="Assignment load">
          <ul className="space-y-2 text-sm">
            {data.workload.length === 0 ? <li className="text-muted">No active assignments.</li> : null}
            {data.workload.map((item) => (
              <li key={item.userId} className="flex justify-between"><span>{users.get(item.userId)?.name ?? "Team member"}</span><span className="num">{item.count}</span></li>
            ))}
          </ul>
        </SummaryCard>
      </div>
    </div>
  );
}
