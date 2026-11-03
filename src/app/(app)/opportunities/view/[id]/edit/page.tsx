import { notFound } from "next/navigation";
import { getOpportunity } from "@/server/services/opportunities";
import { listCountries } from "@/server/services/settings";
import { assertPermission, getCurrentUser } from "@/server/auth/current-user";
import { EntityCreateForm } from "@/features/forms/entity-create-form";
import { PageHeader } from "@/components/layout/page";
import { dateInputValue, stringField } from "@/lib/record-defaults";
import { AppError } from "@/lib/errors";

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  assertPermission(user, "opportunity.update");
  const { id } = await params;
  let record: Record<string, unknown>;
  try {
    record = await getOpportunity(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const fellowship = (record.fellowship ?? {}) as Record<string, unknown>;
  const countries = (await listCountries()).filter((country) => country.active !== false).map((country) => ({ value: String(country.id), label: String(country.name) }));
  return (
    <div>
      <PageHeader title="Edit opportunity" />
      <EntityCreateForm
        kind="opportunity"
        countries={countries}
        redirectTo={`/opportunities/view/${id}`}
        defaults={{
          id,
          version: stringField(record.version ?? 1),
          type: stringField(record.type),
          name: stringField(record.name),
          organization: stringField(record.organization),
          countryId: stringField(record.countryId),
          city: stringField(record.city),
          openingDate: dateInputValue(record.openingDate),
          closingDate: dateInputValue(record.closingDate),
          eligibility: stringField(record.eligibility),
          requirements: stringField(record.requirements),
          funding: stringField(record.funding),
          duration: stringField(fellowship.duration),
          fundingAmount: stringField(fellowship.fundingAmount),
          stipend: stringField(fellowship.stipend),
          travel: stringField(fellowship.travel),
          accommodation: stringField(fellowship.accommodation),
          officialUrl: stringField(record.officialUrl),
          applicationUrl: stringField(record.applicationUrl),
        }}
      />
    </div>
  );
}
