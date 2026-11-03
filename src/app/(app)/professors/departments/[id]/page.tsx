import Link from "next/link";
import { Suspense } from "react";
import { getDepartment, listProfessors } from "@/server/services/professors";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { archiveDepartmentAction } from "@/server/actions/mutations";
import { parseListQuery } from "@/lib/query";
import { PageHeader, EmptyState, Pager } from "@/components/layout/page";
import { RecordActions } from "@/components/records/record-actions";
import { RecordCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/filters/search-box";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";

export default async function DepartmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = parseListQuery(await searchParams, ["name", "updatedAt", "email"], "name");
  let department: Record<string, unknown>;
  let data: Awaited<ReturnType<typeof listProfessors>>;
  try {
    [department, data] = await Promise.all([
      getDepartment(id),
      listProfessors({ ...query, filters: { ...query.filters, department: id } }),
    ]);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const user = await getCurrentUser();
  const universityId = String(department.professorUniversityId ?? "");
  return (
    <div>
      <PageHeader
        title={String(department.name)}
        action={
          <div className="flex flex-wrap gap-2">
            <RecordActions
              editHref={`/professors/departments/${id}/edit`}
              canEdit={can(user, "professor.update")}
              canArchive={can(user, "record.archive")}
              afterArchiveHref={universityId ? `/professors/universities/${universityId}` : "/professors"}
              onArchive={archiveDepartmentAction.bind(null, id)}
            />
            {can(user, "professor.create") ? <Button asChild><Link href={`/professors/departments/${department.id}/new`} prefetch={false}>Add professor</Link></Button> : null}
          </div>
        }
      />
      <div className="mb-4 max-w-md"><Suspense><SearchBox placeholder="Search professors" /></Suspense></div>
      {data.rows.length === 0 ? <EmptyState title="No professors" body="Add professors with only information you can source." /> : (
        <div className="grid gap-2 sm:grid-cols-2">
          {data.rows.map((professor) => (
            <RecordCard key={String(professor.id)} href={`/professors/records/${professor.id}`} title={String(professor.name)} meta={String(professor.designation || "Designation not verified")} />
          ))}
        </div>
      )}
      <Pager page={data.page} hasMore={data.hasMore} path={`/professors/departments/${id}`} query={{ q: query.q }} />
    </div>
  );
}
