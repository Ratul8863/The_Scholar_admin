import { EntityCreateForm } from "@/features/forms/entity-create-form";
import { PageHeader } from "@/components/layout/page";

export default async function NewProfessorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div><PageHeader title="New professor" /><EntityCreateForm kind="professor" defaults={{ departmentId: id }} /></div>;
}
