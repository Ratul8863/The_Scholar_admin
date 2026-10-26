import Link from "next/link";
import { Suspense } from "react";
import { parseListQuery } from "@/lib/query";
import { listProfessors } from "@/server/services/professors";
import { PageHeader, Pager, EmptyState } from "@/components/layout/page";
import { SearchBox } from "@/components/filters/search-box";
import { ProfessorGrid } from "@/features/professors/professor-grid";

export default async function ProfessorTablePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseListQuery(await searchParams, ["updatedAt", "name", "email"]);
  const data = await listProfessors(query);
  return (
    <div>
      <PageHeader title="Professor table" description="Server-side search, pagination, column visibility, resizing, and a frozen name column." />
      <div className="mb-3 max-w-md"><Suspense><SearchBox placeholder="Search professors" /></Suspense></div>
      {data.rows.length === 0 ? <EmptyState title="No professors" body="Add a professor-research university, a department, then a professor." action={<Link className="text-primary" href="/professors">Browse countries</Link>} /> : <ProfessorGrid rows={data.rows.map((row) => ({ id: String(row.id), name: String(row.name ?? ""), designation: String(row.designation ?? ""), email: String(row.email ?? ""), researchAreas: Array.isArray(row.researchAreas) ? row.researchAreas.join(", ") : "", version: Number(row.version ?? 1) }))} />}
      <Pager page={data.page} hasMore={data.hasMore} path="/professors/table" query={{ q: query.q }} />
    </div>
  );
}
