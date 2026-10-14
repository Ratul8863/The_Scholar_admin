import { verificationDetail } from "@/server/services/verification";
import { saveVerificationAction } from "@/server/actions/mutations";
import { PageHeader } from "@/components/layout/page";
import { VerificationForm } from "@/features/verification/verification-form";

export default async function VerificationDetailPage({ params }: { params: Promise<{ entityType: string; entityId: string }> }) {
  const { entityType, entityId } = await params;
  const detail = await verificationDetail(entityType, entityId);
  return (
    <div>
      <PageHeader title={detail.templateName} description={`${detail.progress.percent}% checked · ${detail.progress.missingRequired.length} required items open`} />
      <VerificationForm entityType={entityType} entityId={entityId} items={detail.items.map((item: { key: string; label?: string; required?: boolean; state: string; note?: string }) => ({ key: item.key, label: item.label ?? item.key, required: Boolean(item.required), state: item.state, note: item.note ?? "" }))} save={saveVerificationAction} />
    </div>
  );
}
