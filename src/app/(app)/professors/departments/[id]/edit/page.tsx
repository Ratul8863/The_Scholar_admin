import { notFound } from "next/navigation";
import { getDepartment } from "@/server/services/professors";
import { assertPermission, getCurrentUser } from "@/server/auth/current-user";
import { EntityCreateForm } from "@/features/forms/entity-create-form";
import { PageHeader } from "@/components/layout/page";
import { stringField } from "@/lib/record-defaults";
import { AppError } from "@/lib/errors";

export default async function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  assertPermission(user, "professor.update");
  const { id } = await params;
  let department: Record<string, unknown>;
  try {
    department = await getDepartment(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  return (
    <div>
      <PageHeader title="Edit department" />
      <EntityCreateForm
        kind="department"
        redirectTo={`/professors/departments/${id}`}
        defaults={{
          id,
          version: stringField(department.version ?? 1),
          professorUniversityId: stringField(department.professorUniversityId),
          name: stringField(department.name),
          officialUrl: stringField(department.officialUrl),
          researchAreas: Array.isArray(department.researchAreas) ? department.researchAreas.map(String).join(", ") : "",
          description: stringField(department.description),
        }}
      />
    </div>
  );
}