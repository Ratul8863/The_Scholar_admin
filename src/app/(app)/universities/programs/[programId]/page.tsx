import { getProgram } from "@/server/services/universities";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { archiveProgramAction, saveIntakeAction } from "@/server/actions/mutations";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { RecordActions } from "@/components/records/record-actions";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";

export default async function ProgramPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  let program: Record<string, unknown> & { intakes: Record<string, unknown>[] };
  try {
    program = await getProgram(programId);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const user = await getCurrentUser();
  const intakes = program.intakes ?? [];
  const universityId = String(program.universityId ?? "");
  return (
    <div className="space-y-4">
      <PageHeader
        title={String(program.name)}
        description={`${program.faculty || "Faculty not verified"} · ${program.department || "Department not verified"}`}
        action={
          <RecordActions
            editHref={`/universities/programs/${programId}/edit`}
            canEdit={can(user, "university.update")}
            canArchive={can(user, "record.archive")}
            afterArchiveHref={universityId ? `/universities/${universityId}` : "/universities"}
            onArchive={archiveProgramAction.bind(null, programId)}
          />
        }
      />
      <SectionCard title="Requirements and fees">
        <p className="text-sm">Tuition: {program.tuitionFee == null || program.tuitionFee === "" ? "Not verified" : String(program.tuitionFee)} {String(program.currency || "")}</p>
        <p className="mt-2 text-sm">Application fee: {program.applicationFee == null || program.applicationFee === "" ? "Not verified" : String(program.applicationFee)}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">{String(program.academicRequirements || "Academic requirements not verified")}</p>
        <p className="mt-2 text-sm text-muted">Bangladesh eligible: {String(program.bangladeshEligible)}</p>
      </SectionCard>
      <SectionCard title="Intakes">
        <ul className="mb-3 text-sm">{intakes.map((intake) => <li key={String(intake.id)}>{String(intake.season)} {String(intake.year ?? "")}</li>)}</ul>
        {can(user, "university.update") ? (
          <form action={async (formData) => { "use server"; await saveIntakeAction({ programId: program.id, season: formData.get("season"), year: formData.get("year"), openingDate: formData.get("openingDate"), closingDate: formData.get("closingDate"), sourceUrl: formData.get("sourceUrl") }); }} className="grid gap-2 sm:grid-cols-2">
            <Select name="season" aria-label="Season" options={["spring", "summer", "fall", "winter", "rolling", "multiple", "other"].map((season) => ({ value: season, label: season }))} />
            <Input name="year" placeholder="Year" />
            <Input name="openingDate" type="date" />
            <Input name="closingDate" type="date" />
            <Input name="sourceUrl" type="url" placeholder="Source URL" />
            <Button type="submit" size="sm">Add intake</Button>
          </form>
        ) : null}
      </SectionCard>
    </div>
  );
}