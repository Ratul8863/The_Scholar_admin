import { getOpportunity } from "@/server/services/opportunities";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";

export default async function OpportunityViewPage({ params }: { params: Promise<{ id: string }> }) {
  let record: Record<string, unknown>;
  try {
    record = await getOpportunity((await params).id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  return (
    <div>
      <PageHeader title={String(record.name)} description={`${record.type} · ${record.organization}`} />
      <SectionCard title="Details">
        <p className="whitespace-pre-wrap text-sm">{String(record.eligibility || "Eligibility not verified")}</p>
        <p className="mt-2 text-sm text-muted">{String(record.requirements || "Requirements not verified")}</p>
        {record.officialUrl ? <a className="mt-3 inline-block text-sm text-primary" href={String(record.officialUrl)}>Official source</a> : null}
      </SectionCard>
    </div>
  );
}
