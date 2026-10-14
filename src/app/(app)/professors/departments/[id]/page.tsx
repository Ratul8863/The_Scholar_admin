import Link from "next/link";
import { getDepartment } from "@/server/services/professors";
import { PageHeader, EmptyState } from "@/components/layout/page";
import { RecordCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";

export default async function DepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  let department: Record<string, unknown>;
  try {
    department = await getDepartment((await params).id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const professors = (department.professors as Record<string, unknown>[]) ?? [];
  return (
    <div>
      <PageHeader title={String(department.name)} action={<Button asChild><Link href={`/professors/departments/${department.id}/new`}>Add professor</Link></Button>} />
      {professors.length === 0 ? <EmptyState title="No professors" body="Add professors with only information you can source." /> : <div className="grid gap-2 sm:grid-cols-2">{professors.map((professor) => <RecordCard key={String(professor.id)} href={`/professors/records/${professor.id}`} title={String(professor.name)} meta={String(professor.designation || "Designation not verified")} />)}</div>}
    </div>
  );
}
