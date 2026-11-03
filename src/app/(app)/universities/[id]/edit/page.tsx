import { notFound } from "next/navigation";
import { getUniversity } from "@/server/services/universities";
import { listCountries } from "@/server/services/settings";
import { assertPermission, getCurrentUser } from "@/server/auth/current-user";
import { EntityCreateForm } from "@/features/forms/entity-create-form";
import { PageHeader } from "@/components/layout/page";
import { stringField } from "@/lib/record-defaults";
import { AppError } from "@/lib/errors";

export default async function EditUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  assertPermission(user, "university.update");
  const { id } = await params;
  let university: Record<string, unknown>;
  try {
    university = await getUniversity(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const countries = (await listCountries()).filter((country) => country.active !== false).map((country) => ({ value: String(country.id), label: String(country.name) }));
  return (
    <div>
      <PageHeader title="Edit university" />
      <EntityCreateForm
        kind="university"
        countries={countries}
        redirectTo={`/universities/${id}`}
        defaults={{
          id,
          version: stringField(university.version ?? 1),
          name: stringField(university.name),
          countryId: stringField(university.countryId),
          city: stringField(university.city),
          region: stringField(university.region),
          universityType: stringField(university.universityType || "other"),
          website: stringField(university.website),
          acceptanceRate: university.acceptanceRate == null ? "" : String(university.acceptanceRate),
          description: stringField(university.description),
        }}
      />
    </div>
  );
}
