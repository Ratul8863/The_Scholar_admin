import { notFound } from "next/navigation";
import { getEmergency } from "@/server/services/opportunities";
import { listCountries } from "@/server/services/settings";
import { assertPermission, getCurrentUser } from "@/server/auth/current-user";
import { EntityCreateForm } from "@/features/forms/entity-create-form";
import { PageHeader } from "@/components/layout/page";
import { stringField } from "@/lib/record-defaults";
import { AppError } from "@/lib/errors";

export default async function EditEmergencyPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  assertPermission(user, "emergency.update");
  const { id } = await params;
  let record: Record<string, unknown>;
  try {
    record = await getEmergency(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const countries = (await listCountries()).filter((country) => country.active !== false).map((country) => ({ value: String(country.id), label: String(country.name) }));
  return (
    <div>
      <PageHeader title="Edit emergency update" />
      <EntityCreateForm
        kind="emergency"
        countries={countries}
        redirectTo={`/emergency/${id}`}
        defaults={{
          id,
          version: stringField(record.version ?? 1),
          title: stringField(record.title),
          informationType: stringField(record.informationType),
          countryId: stringField(record.countryId),
          urgency: stringField(record.urgency || "normal"),
          sourceName: stringField(record.sourceName),
          sourceUrl: stringField(record.sourceUrl),
          information: stringField(record.information),
        }}
      />
    </div>
  );
}
