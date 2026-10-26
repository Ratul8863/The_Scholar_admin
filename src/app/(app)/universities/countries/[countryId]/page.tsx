import Link from "next/link";
import { Suspense } from "react";
import { universitiesForCountry } from "@/server/services/universities";
import { Country } from "@/models/reference";
import { oid, ready } from "@/server/services/query";
import { parseListQuery } from "@/lib/query";
import { PageHeader, EmptyState, Pager } from "@/components/layout/page";
import { RecordCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/filters/search-box";

export default async function CountryUniversitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { countryId } = await params;
  const query = parseListQuery(await searchParams, ["name", "updatedAt"], "name");
  await ready();
  const [country, data] = await Promise.all([
    Country.findById(oid(countryId)).select("name").lean(),
    universitiesForCountry(countryId, query),
  ]);
  return (
    <div>
      <PageHeader title={country?.name ?? "Country"} description="Universities in the main admissions hierarchy." action={<Button asChild><Link href={`/universities/new?country=${countryId}`}>Add university</Link></Button>} />
      <div className="mb-4 max-w-md"><Suspense><SearchBox placeholder="Search universities" /></Suspense></div>
      {data.rows.length === 0 ? <EmptyState title="No universities in this country" body="Create the first university when you have an official source." /> : (
        <div className="grid gap-2 sm:grid-cols-2">
          {data.rows.map((row) => <RecordCard key={String(row.id)} href={`/universities/${row.id}`} title={String(row.name)} meta={String(row.city || "City not verified")} />)}
        </div>
      )}
      <Pager page={data.page} hasMore={data.hasMore} path={`/universities/countries/${countryId}`} query={{ q: query.q }} />
    </div>
  );
}
