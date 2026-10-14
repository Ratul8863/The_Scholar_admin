import { listCountries } from "@/server/services/settings";
import { PageHeader } from "@/components/layout/page";
import { ScholarshipForm } from "@/features/scholarships/scholarship-form";

export default async function NewScholarshipPage() {
  const countries = await listCountries();
  return (
    <div>
      <PageHeader title="New scholarship" description="Leave unknown facts blank. The record will show them as not verified instead of inventing a value." />
      <ScholarshipForm countries={countries.filter((country) => country.active !== false).map((country) => ({ value: String(country.id), label: String(country.name) }))} />
    </div>
  );
}
