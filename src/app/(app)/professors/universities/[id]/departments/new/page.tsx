import { EntityCreateForm } from "@/features/forms/entity-create-form";
import { PageHeader } from "@/components/layout/page";

export default async function NewDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="New department" />
      <EntityCreateForm kind="department" defaults={{ professorUniversityId: id }} />
    </div>
  );
}
