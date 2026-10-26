import Link from "next/link";
import { Suspense } from "react";
import { listProfessorUniversities } from "@/server/services/professors";
import { parseListQuery } from "@/lib/query";
import { PageHeader, EmptyState, Pager } from "@/components/layout/page";
import { RecordCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/filters/search-box";

export default async function ProfessorCountryPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { countryId } = await params;
  const query = parseListQuery(await searchParams, ["name", "updatedAt"], "name");
  const data = await listProfessorUniversities(countryId, query);
  return (
    <div>
      <PageHeader title="Professor-research universities" action={<Button asChild><Link href={`/professors/countries/${countryId}/new`}>Add university</Link></Button>} />
      <div className="mb-4 max-w-md"><Suspense><SearchBox placeholder="Search universities" /></Suspense></div>
      {data.rows.length === 0 ? <EmptyState title="No professor-research universities" body="Adding one here does not create a main university." /> : (
        <div className="grid gap-2 sm:grid-cols-2">{data.rows.map((row) => <RecordCard key={String(row.id)} href={`/professors/universities/${row.id}`} title={String(row.name)} />)}</div>
      )}
      <Pager page={data.page} hasMore={data.hasMore} path={`/professors/countries/${countryId}`} query={{ q: query.q }} />
    </div>
  );
}
