import { listCountries } from "@/server/services/settings";
import { PageHeader } from "@/components/layout/page";
import { EntityCreateForm } from "@/features/forms/entity-create-form";

export default async function NewOpportunityPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const countries = await listCountries();
  return (
    <div>
      <PageHeader title={`New ${type}`} />
      <EntityCreateForm kind="opportunity" defaults={{ type }} countries={countries.filter((item) => item.active !== false).map((item) => ({ value: String(item.id), label: String(item.name) }))} />
    </div>
  );
}
