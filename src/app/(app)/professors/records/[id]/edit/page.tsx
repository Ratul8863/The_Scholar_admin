import { notFound } from "next/navigation";
import { getProfessor } from "@/server/services/professors";
import { assertPermission, getCurrentUser } from "@/server/auth/current-user";
import { EntityCreateForm } from "@/features/forms/entity-create-form";
import { PageHeader } from "@/components/layout/page";
import { stringField } from "@/lib/record-defaults";
import { AppError } from "@/lib/errors";

export default async function EditProfessorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  assertPermission(user, "professor.update");
  const { id } = await params;
  let professor: Record<string, unknown>;
  try {
    professor = await getProfessor(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  return (
    <div>
      <PageHeader title="Edit professor" description="Fix wrong details, then save. Verified facts should stay sourced." />
      <EntityCreateForm
        kind="professor"
        submitLabel="Save professor"
        redirectTo={`/professors/records/${id}`}
        defaults={{
          id,
          version: stringField(professor.version ?? 1),
          departmentId: stringField(professor.departmentId),
          name: stringField(professor.name),
          email: stringField(professor.email),
          designation: stringField(professor.designation),
          researchAreas: Array.isArray(professor.researchAreas) ? professor.researchAreas.map(String).join(", ") : "",
          recentResearch: stringField(professor.recentResearch),
          previousResearch: stringField(professor.previousResearch),
          officialProfile: stringField(professor.officialProfile),
          labName: stringField(professor.labName),
          labUrl: stringField(professor.labUrl),
          googleScholarUrl: stringField(professor.googleScholarUrl),
          orcid: stringField(professor.orcid),
          website: stringField(professor.website),
        }}
      />
    </div>
  );
}
