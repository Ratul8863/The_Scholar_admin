import { listActivity } from "@/server/services/audit";
import { userLookup } from "@/server/services/query";
import { PageHeader, Pager } from "@/components/layout/page";
import { ContentCard } from "@/components/ui/card";
import { titleCaseStatus } from "@/lib/utils";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string; entityType?: string }> }) {
  const params = await searchParams;
  const data = await listActivity({ page: Number(params.page ?? 1), entityType: params.entityType });
  const users = await userLookup(data.rows.map((row) => row.actorUserId));
  return (
    <div>
      <PageHeader title="Activity log" description="History is append-only. It cannot be edited from the workspace." />
      <ContentCard title="History">
        <ul className="divide-y divide-line">
          {data.rows.length === 0 ? <li className="py-2 text-sm text-muted">No activity yet.</li> : null}
          {data.rows.map((row) => (
            <li key={String(row._id)} className="py-3 text-sm">
              <p><span className="font-medium">{users.get(String(row.actorUserId))?.name ?? "User"}</span> {titleCaseStatus(row.action)} {row.entityType}</p>
              {row.changes?.length ? <p className="text-muted">{row.changes.map((change: { field?: string; oldValue?: unknown; newValue?: unknown }) => `${change.field}: ${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.newValue)}`).join("; ")}</p> : null}
              <time className="text-xs text-muted">{new Date(row.timestamp).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      </ContentCard>
      <Pager page={data.page} hasMore={data.hasMore} path="/activity" query={{ entityType: params.entityType }} />
    </div>
  );
}
