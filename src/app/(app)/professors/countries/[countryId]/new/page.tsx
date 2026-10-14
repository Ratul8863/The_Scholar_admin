import { listCountries } from "@/server/services/settings";
import { EntityCreateForm } from "@/features/forms/entity-create-form";
import { PageHeader } from "@/components/layout/page";

export default async function NewProfessorUniversityPage({ params }: { params: Promise<{ countryId: string }> }) {
  const { countryId } = await params;
  const countries = await listCountries();
  return (
    <div>
      <PageHeader title="New professor-research university" />
      <EntityCreateForm kind="professor-university" defaults={{ countryId }} countries={countries.map((country) => ({ value: String(country.id), label: String(country.name) }))} />
    </div>
  );
}
