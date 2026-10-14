import { getEmergency } from "@/server/services/opportunities";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { Badge, statusTone } from "@/components/ui/badge";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";

export default async function EmergencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  let record: Record<string, unknown>;
  try {
    record = await getEmergency((await params).id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  return (
    <div>
      <PageHeader title={String(record.title)} action={<Badge tone={statusTone(String(record.urgency))}>{String(record.urgency)}</Badge>} />
      <SectionCard title="Information">
        <p className="whitespace-pre-wrap text-sm">{String(record.information || "Not verified")}</p>
        {record.sourceUrl ? <a className="mt-3 inline-block text-sm text-primary" href={String(record.sourceUrl)}>{String(record.sourceName || record.sourceUrl)}</a> : <p className="mt-3 text-sm text-muted">Source not verified</p>}
      </SectionCard>
    </div>
  );
}
