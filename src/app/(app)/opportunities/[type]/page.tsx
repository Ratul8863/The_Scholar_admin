import Link from "next/link";
import { notFound } from "next/navigation";
import { listOpportunities } from "@/server/services/opportunities";
import { parseListQuery } from "@/lib/query";
import { PageHeader, EmptyState, Pager } from "@/components/layout/page";
import { RecordCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const allowed = new Set(["leadership", "fellowship", "internship"]);

export default async function OpportunityTypePage({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { type } = await params;
  if (!allowed.has(type)) notFound();
  const query = parseListQuery(await searchParams, ["updatedAt", "name"]);
  const data = await listOpportunities(type, query);
  return (
    <div>
      <PageHeader title={type[0]!.toUpperCase() + type.slice(1)} action={<Button asChild><Link href={`/opportunities/${type}/new`}>Add {type}</Link></Button>} />
      {data.rows.length === 0 ? <EmptyState title={`No ${type} records`} body="Add one when you have an official source." /> : (
        <div className="grid gap-2 sm:grid-cols-2">
          {data.rows.map((row) => <RecordCard key={String(row.id)} href={`/opportunities/view/${row.id}`} title={String(row.name)} meta={`${String(row.organization)} · ${String(row.countryName || "Country not set")}`} />)}
        </div>
      )}
      <Pager page={data.page} hasMore={data.hasMore} path={`/opportunities/${type}`} query={{ q: query.q }} />
    </div>
  );
}
