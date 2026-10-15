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
      <section className="overview-stats" aria-label="Counts">
        {metrics.map(([label, value]) => (
          <MetricCard key={String(label)} label={String(label)} value={value} />
        ))}
      </section>
      <div className="overview-mid">
        <SummaryCard title="Deadlines">
          <dl className="grid grid-cols-2 gap-4">
            <div><dt className="type-14">Next 5 days</dt><dd className="type-32 num">{data.buckets.next5}</dd></div>
            <div><dt className="type-14">Next 7 days</dt><dd className="type-32 num">{data.buckets.next7}</dd></div>
            <div><dt className="type-14">Next 30 days</dt><dd className="type-32 num">{data.buckets.next30}</dd></div>
            <div><dt className="type-14">Next 60 days</dt><dd className="type-32 num">{data.buckets.next60}</dd></div>
          </dl>
          <Link className="open-pill mt-4" href="/deadlines">Open deadline intelligence</Link>
        </SummaryCard>
        <SummaryCard title="Content workflow">
          <ul className="sheet-list">
            {Object.keys(data.contentCounts).length === 0 ? <li className="type-16 text-muted">No content records yet.</li> : null}
            {Object.entries(data.contentCounts).map(([status, count]) => (
              <li key={status}><span className="type-16">{titleCaseStatus(status)}</span><span className="type-32 num">{count}</span></li>
            ))}
          </ul>
        </SummaryCard>
      </div>
      <div className="overview-lower">
        <SummaryCard title="Recent activity">
          <ul className="sheet-list">
            {data.activity.length === 0 ? <li className="type-16 text-muted">Changes will appear here after the team starts working.</li> : null}
            {data.activity.map((item) => (
              <li key={String(item.id)}>
                <span className="type-16">{titleCaseStatus(String(item.action))} {String(item.entityType)}</span>
                <time className="type-date">{item.timestamp ? new Date(String(item.timestamp)).toLocaleString() : ""}</time>
              </li>
            ))}
          </ul>
        </SummaryCard>
        <SummaryCard title="Assignment load">
          <ul className="sheet-list">
            {data.workload.length === 0 ? <li className="type-16 text-muted">No active assignments.</li> : null}
            {data.workload.map((item) => (
              <li key={item.userId}><span className="type-16">{users.get(item.userId)?.name ?? "Team member"}</span><span className="type-32 num">{item.count}</span></li>
            ))}
          </ul>
        </SummaryCard>
      </div>
    </div>
  );
}
