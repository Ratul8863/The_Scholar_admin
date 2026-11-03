import { notFound } from "next/navigation";
import { getProfessorUniversity } from "@/server/services/professors";
import { listCountries } from "@/server/services/settings";
import { assertPermission, getCurrentUser } from "@/server/auth/current-user";
import { EntityCreateForm } from "@/features/forms/entity-create-form";
import { PageHeader } from "@/components/layout/page";
import { stringField } from "@/lib/record-defaults";
import { AppError } from "@/lib/errors";

export default async function EditProfessorUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  assertPermission(user, "professor.update");
  const { id } = await params;
  let university: Record<string, unknown>;
  try {
    university = await getProfessorUniversity(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const countries = (await listCountries()).filter((country) => country.active !== false).map((country) => ({ value: String(country.id), label: String(country.name) }));
  return (
    <div>
      <PageHeader title="Edit professor-research university" />
      <EntityCreateForm
        kind="professor-university"
        countries={countries}
        redirectTo={`/professors/universities/${id}`}
        defaults={{
          id,
          version: stringField(university.version ?? 1),
          name: stringField(university.name),
          countryId: stringField(university.countryId),
          city: stringField(university.city),
          website: stringField(university.website),
        }}
      />
    </div>
  );
}
