import { verificationQueue } from "@/server/services/verification";
import { PageHeader, EmptyState } from "@/components/layout/page";
import { RecordCard } from "@/components/ui/card";

export default async function VerificationPage() {
  const rows = await verificationQueue();
  return (
    <div>
      <PageHeader title="Verification" description="Checklist progress is calculated. A record is not verified by a single checkbox." />
      {rows.length === 0 ? <EmptyState title="Nothing waiting" body="Records that are not verified will gather here." /> : (
        <div className="grid gap-2">
          {rows.map((row) => <RecordCard key={`${row.entityType}-${row.id}`} href={`/verification/${row.entityType}/${row.id}`} title={row.title} meta={row.entityType} />)}
        </div>
      )}
    </div>
  );
}
