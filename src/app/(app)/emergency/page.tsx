import Link from "next/link";
import { listEmergencies } from "@/server/services/opportunities";
import { parseListQuery } from "@/lib/query";
import { PageHeader, EmptyState, Pager } from "@/components/layout/page";
import { AlertCard, RecordCard } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function EmergencyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseListQuery(await searchParams, ["createdAt", "title"], "createdAt");
  const data = await listEmergencies(query);
  return (
    <div>
      <PageHeader title="Emergency upload" description="Urgent items stay visually distinct and also appear at the top of Content." action={<Button asChild><Link href="/emergency/new">Add update</Link></Button>} />
      {data.rows.length === 0 ? <EmptyState title="No emergency updates" body="Add breaking scholarship, deadline, or university news when it is sourced." /> : (
        <div className="grid gap-2">
          {data.rows.map((row) => row.urgency === "emergency" ? (
            <AlertCard key={String(row.id)} href={`/emergency/${row.id}`} tone="danger" title={String(row.title)}>
              <Badge tone={statusTone(String(row.urgency))}>{String(row.urgency)}</Badge>
            </AlertCard>
          ) : (
            <RecordCard key={String(row.id)} href={`/emergency/${row.id}`} title={String(row.title)}>
              <Badge tone={statusTone(String(row.urgency))}>{String(row.urgency)}</Badge>
            </RecordCard>
          ))}
        </div>
      )}
      <Pager page={data.page} hasMore={data.hasMore} path="/emergency" query={{ q: query.q, urgency: query.filters.urgency }} />
    </div>
  );
}
