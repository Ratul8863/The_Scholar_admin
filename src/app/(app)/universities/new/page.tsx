import { listCountries } from "@/server/services/settings";
import { PageHeader } from "@/components/layout/page";
import { EntityCreateForm } from "@/features/forms/entity-create-form";

export default async function NewUniversityPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams;
  const countries = await listCountries();
  return (
    <div>
      <PageHeader title="New university" description="This creates a main university, not a professor-research university." />
      <EntityCreateForm kind="university" defaults={{ countryId: country ?? "" }} countries={countries.filter((item) => item.active !== false).map((item) => ({ value: String(item.id), label: String(item.name) }))} />
    </div>
  );
}
