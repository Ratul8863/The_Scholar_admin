import Link from "next/link";
import { listDeadlines } from "@/server/services/deadlines";
import { PageHeader } from "@/components/layout/page";
import { RecordCard } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";

const buckets = [
  ["5", "Next 5 days"],
  ["7", "Next 7 days"],
  ["30", "Next 30 days"],
  ["60", "Next 60 days"],
  ["past", "Past / closed"],
  ["opening", "Opening soon"],
];

export default async function DeadlinesPage({ searchParams }: { searchParams: Promise<{ bucket?: string }> }) {
  const { bucket = "30" } = await searchParams;
  const rows = await listDeadlines(bucket);
  return (
    <div>
      <PageHeader title="Deadlines" description="Dates are calculated from stored opening and closing timestamps. Missing dates stay unknown." />
      <div className="chip-row mb-4">
        {buckets.map(([key, label]) => (
          <Link key={key} href={`/deadlines?bucket=${key}`} className="filter-chip" data-active={bucket === key ? "true" : "false"}>{label}</Link>
        ))}
      </div>
      <div className="grid gap-2 md:hidden">
        {rows.length === 0 ? <p className="text-sm text-muted">No deadlines in this window.</p> : null}
        {rows.map((row) => (
          <RecordCard key={String(row.id)} href={String(row.href)} title={String(row.label || row.deadlineType)} meta={String(row.entityType)}>
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(String(row.state))}>{String(row.state).replaceAll("_", " ")}</Badge>
              <span className="num text-muted">{row.daysRemaining == null ? "No close date" : `${String(row.daysRemaining)} days left`}</span>
            </span>
          </RecordCard>
        ))}
      </div>
      <div className="data-sheet table-scroll hidden md:block">
        <table className="data-table">
          <thead><tr><th>Record</th><th>Type</th><th>State</th><th>Days remaining</th><th>Days until opening</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td className="text-muted" colSpan={5}>No deadlines in this window.</td></tr> : null}
            {rows.map((row) => (
              <tr key={String(row.id)}>
                <td><Link className="font-medium text-primary" href={String(row.href)}>{String(row.label || row.deadlineType)}</Link></td>
                <td>{String(row.entityType)}</td>
                <td><Badge tone={statusTone(String(row.state))}>{String(row.state).replaceAll("_", " ")}</Badge></td>
                <td className="num">{row.daysRemaining == null ? "—" : String(row.daysRemaining)}</td>
                <td className="num">{row.daysUntilOpening == null ? "—" : String(row.daysUntilOpening)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
