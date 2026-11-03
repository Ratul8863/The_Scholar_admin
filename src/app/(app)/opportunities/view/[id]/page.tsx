import { getOpportunity } from "@/server/services/opportunities";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { archiveOpportunityAction } from "@/server/actions/mutations";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { RecordActions } from "@/components/records/record-actions";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";

export default async function OpportunityViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let record: Record<string, unknown>;
  try {
    record = await getOpportunity(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const user = await getCurrentUser();
  const type = String(record.type ?? "leadership");
  return (
    <div>
      <PageHeader
        title={String(record.name)}
        description={`${record.type} · ${record.organization}`}
        action={
          <RecordActions
            editHref={`/opportunities/view/${id}/edit`}
            canEdit={can(user, "opportunity.update")}
            canArchive={can(user, "record.archive")}
            afterArchiveHref={`/opportunities/${type}`}
            onArchive={archiveOpportunityAction.bind(null, id)}
          />
        }
      />
      <SectionCard title="Details">
        <p className="whitespace-pre-wrap text-sm">{String(record.eligibility || "Eligibility not verified")}</p>
        <p className="mt-2 text-sm text-muted">{String(record.requirements || "Requirements not verified")}</p>
        {record.officialUrl ? <a className="mt-3 inline-block text-sm text-primary" href={String(record.officialUrl)}>Official source</a> : null}
      </SectionCard>
    </div>
  );
}
