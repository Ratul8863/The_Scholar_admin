import { listCatalog, listCountries } from "@/server/services/settings";
import { PageHeader } from "@/components/layout/page";
import { ScholarshipForm } from "@/features/scholarships/scholarship-form";

export default async function NewScholarshipPage() {
  const [countries, degrees] = await Promise.all([listCountries(), listCatalog("degreeLevels")]);
  return (
    <div>
      <PageHeader title="New scholarship" description="Leave unknown facts blank. The record will show them as not verified instead of inventing a value." />
      <ScholarshipForm
        countries={countries.filter((country) => country.active !== false).map((country) => ({ value: String(country.id), label: String(country.name) }))}
        degreeLevels={degrees.filter((row) => row.active !== false).map((row) => ({ value: String(row.id), label: String(row.name) }))}
      />
    </div>
  );
}
