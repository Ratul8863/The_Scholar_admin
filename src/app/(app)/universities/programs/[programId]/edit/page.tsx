import { notFound } from "next/navigation";
import { getProgram } from "@/server/services/universities";
import { assertPermission, getCurrentUser } from "@/server/auth/current-user";
import { EntityCreateForm } from "@/features/forms/entity-create-form";
import { PageHeader } from "@/components/layout/page";
import { stringField } from "@/lib/record-defaults";
import { AppError } from "@/lib/errors";

export default async function EditProgramPage({ params }: { params: Promise<{ programId: string }> }) {
  const user = await getCurrentUser();
  assertPermission(user, "university.update");
  const { programId } = await params;
  let program: Record<string, unknown>;
  try {
    program = await getProgram(programId);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  return (
    <div>
      <PageHeader title="Edit program" />
      <EntityCreateForm
        kind="program"
        redirectTo={`/universities/programs/${programId}`}
        defaults={{
          id: programId,
          version: stringField(program.version ?? 1),
          universityId: stringField(program.universityId),
          name: stringField(program.name),
          department: stringField(program.department),
          faculty: stringField(program.faculty),
          language: stringField(program.language),
          tuitionFee: program.tuitionFee == null ? "" : String(program.tuitionFee),
          currency: stringField(program.currency),
          applicationFee: program.applicationFee == null ? "" : String(program.applicationFee),
          eligibility: stringField(program.eligibility),
          academicRequirements: stringField(program.academicRequirements),
          bangladeshEligible: stringField(program.bangladeshEligible || "unknown"),
          scholarshipAvailable: stringField(program.scholarshipAvailable || "unknown"),
        }}
      />
    </div>
  );
}
