import Link from "next/link";
import { Suspense } from "react";
import { parseListQuery } from "@/lib/query";
import { listProfessors } from "@/server/services/professors";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { PageHeader, Pager, EmptyState } from "@/components/layout/page";
import { SearchBox } from "@/components/filters/search-box";
import { RecordCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfessorBulkBar } from "@/features/professors/professor-bulk-bar";

export default async function ProfessorTablePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseListQuery(await searchParams, ["updatedAt", "name", "email"]);
  const [user, data] = await Promise.all([getCurrentUser(), listProfessors(query)]);
  const rows = data.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    designation: String(row.designation ?? ""),
    email: String(row.email ?? ""),
    researchAreas: Array.isArray(row.researchAreas) ? row.researchAreas.map(String).join(", ") : "",
  }));
  const canArchive = can(user, "record.archive");

  return (
    <div>
      <PageHeader
        title="Professor table"
        description="Search and browse every professor. Open a row to edit details."
        action={
          <Button asChild variant="outline">
            <Link href="/professors" prefetch={false}>Browse by country</Link>
          </Button>
        }
      />
      <div className="mb-4 max-w-md">
        <Suspense>
          <SearchBox placeholder="Search professors" />
        </Suspense>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title="No professors"
          body="Add a professor-research university, a department, then a professor."
          action={<Button asChild variant="outline"><Link href="/professors" prefetch={false}>Browse countries</Link></Button>}
        />
      ) : (
        <>
          {canArchive ? <ProfessorBulkBar ids={rows.map((row) => row.id)} /> : null}
          <div className="grid gap-2 md:hidden">
            {rows.map((row) => (
              <RecordCard
                key={row.id}
                href={`/professors/records/${row.id}`}
                title={row.name}
                meta={[row.designation, row.email].filter(Boolean).join(" · ") || "Details not verified"}
              >
                {row.researchAreas ? <p className="type-14">{row.researchAreas}</p> : null}
              </RecordCard>
            ))}
          </div>
          <div className="data-sheet table-scroll hidden md:block">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  {canArchive ? <th className="w-12"><span className="sr-only">Select</span></th> : null}
                  <th>Professor</th>
                  <th>Designation</th>
                  <th>Email</th>
                  <th>Research areas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {canArchive ? (
                      <td>
                        <input form="professor-bulk" type="checkbox" name="ids" value={row.id} className="accent-primary" aria-label={`Select ${row.name}`} />
                      </td>
                    ) : null}
                    <td>
                      <Link className="font-medium text-primary" href={`/professors/records/${row.id}`} prefetch={false}>
                        {row.name}
                      </Link>
                    </td>
                    <td>{row.designation || "—"}</td>
                    <td className="max-w-[220px] truncate">{row.email || "—"}</td>
                    <td className="max-w-[280px] truncate" title={row.researchAreas}>{row.researchAreas || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Pager page={data.page} hasMore={data.hasMore} path="/professors/table" query={{ q: query.q }} />
    </div>
  );
}
