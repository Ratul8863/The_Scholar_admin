import Link from "next/link";
import { getProfessorUniversity } from "@/server/services/professors";
import { PageHeader, EmptyState } from "@/components/layout/page";
import { RecordCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";

export default async function ProfessorUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  let university: Record<string, unknown>;
  try {
    university = await getProfessorUniversity((await params).id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const departments = (university.departments as Record<string, unknown>[]) ?? [];
  return (
    <div>
      <PageHeader title={String(university.name)} description="Professor research only." action={<Button asChild><Link href={`/professors/universities/${university.id}/departments/new`}>Add department</Link></Button>} />
      {departments.length === 0 ? <EmptyState title="No departments" body="Add departments one by one." /> : <div className="grid gap-2 sm:grid-cols-2">{departments.map((department) => <RecordCard key={String(department.id)} href={`/professors/departments/${department.id}`} title={String(department.name)} />)}</div>}
    </div>
  );
}
