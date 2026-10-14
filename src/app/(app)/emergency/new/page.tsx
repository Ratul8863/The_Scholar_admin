import { listCountries } from "@/server/services/settings";
import { PageHeader } from "@/components/layout/page";
import { EntityCreateForm } from "@/features/forms/entity-create-form";

export default async function NewEmergencyPage() {
  const countries = await listCountries();
  return (
    <div>
      <PageHeader title="New emergency update" description="Use Emergency only when the information needs the content team immediately." />
      <EntityCreateForm kind="emergency" countries={countries.filter((item) => item.active !== false).map((item) => ({ value: String(item.id), label: String(item.name) }))} />
    </div>
  );
}
