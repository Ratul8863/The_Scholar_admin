import { EntityCreateForm } from "@/features/forms/entity-create-form";
import { PageHeader } from "@/components/layout/page";

export default async function NewProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div><PageHeader title="New program" /><EntityCreateForm kind="program" defaults={{ universityId: id }} /></div>;
}
