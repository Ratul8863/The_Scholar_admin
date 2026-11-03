import Link from "next/link";
import { getProfessorUniversity } from "@/server/services/professors";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { archiveProfessorUniversityAction } from "@/server/actions/mutations";
import { PageHeader, EmptyState } from "@/components/layout/page";
import { RecordActions } from "@/components/records/record-actions";
import { RecordCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";

export default async function ProfessorUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let university: Record<string, unknown>;
  try {
    university = await getProfessorUniversity(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const user = await getCurrentUser();
  const departments = (university.departments as Record<string, unknown>[]) ?? [];
  const countryId = String(university.countryId ?? "");
  return (
    <div>
      <PageHeader
        title={String(university.name)}
        description="Professor research only."
        action={
          <div className="flex flex-wrap gap-2">
            <RecordActions
              editHref={`/professors/universities/${id}/edit`}
              canEdit={can(user, "professor.update")}
              canArchive={can(user, "record.archive")}
              afterArchiveHref={countryId ? `/professors/countries/${countryId}` : "/professors"}
              onArchive={archiveProfessorUniversityAction.bind(null, id)}
            />
            {can(user, "professor.create") ? <Button asChild><Link href={`/professors/universities/${university.id}/departments/new`} prefetch={false}>Add department</Link></Button> : null}
          </div>
        }
      />
      {departments.length === 0 ? <EmptyState title="No departments" body="Add departments one by one." /> : <div className="grid gap-2 sm:grid-cols-2">{departments.map((department) => <RecordCard key={String(department.id)} href={`/professors/departments/${department.id}`} title={String(department.name)} />)}</div>}
    </div>
  );
}
