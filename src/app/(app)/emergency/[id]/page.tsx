import { getEmergency } from "@/server/services/opportunities";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { archiveEmergencyAction } from "@/server/actions/mutations";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { RecordActions } from "@/components/records/record-actions";
import { Badge, statusTone } from "@/components/ui/badge";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";

export default async function EmergencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let record: Record<string, unknown>;
  try {
    record = await getEmergency(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const user = await getCurrentUser();
  return (
    <div>
      <PageHeader
        title={String(record.title)}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(String(record.urgency))}>{String(record.urgency)}</Badge>
            <RecordActions
              editHref={`/emergency/${id}/edit`}
              canEdit={can(user, "emergency.update")}
              canArchive={can(user, "record.archive")}
              afterArchiveHref="/emergency"
              onArchive={archiveEmergencyAction.bind(null, id)}
            />
          </div>
        }
      />
      <SectionCard title="Information">
        <p className="whitespace-pre-wrap text-sm">{String(record.information || "Not verified")}</p>
        {record.sourceUrl ? <a className="mt-3 inline-block text-sm text-primary" href={String(record.sourceUrl)}>{String(record.sourceName || record.sourceUrl)}</a> : <p className="mt-3 text-sm text-muted">Source not verified</p>}
      </SectionCard>
    </div>
  );
}
