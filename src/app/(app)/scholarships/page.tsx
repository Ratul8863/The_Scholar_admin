import Link from "next/link";
import { Suspense } from "react";
import { parseListQuery } from "@/lib/query";
import { listScholarships } from "@/server/services/scholarships";
import { listCountries } from "@/server/services/settings";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { deadlineState, deadlineLabel } from "@/server/domain/deadlines";
import { PageHeader, Pager, EmptyState } from "@/components/layout/page";
import { RecordCard } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { SearchBox, FilterSelect } from "@/components/filters/search-box";
import { Button } from "@/components/ui/button";

export default async function ScholarshipsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = parseListQuery(params, ["updatedAt", "name", "closingDate"]);
  const [user, data, countries] = await Promise.all([getCurrentUser(), listScholarships(query), listCountries()]);
  const countryOptions = countries.filter((country) => country.active !== false).map((country) => ({ value: String(country.id), label: String(country.name) }));
  return (
    <div>
      <PageHeader title="Scholarships" description="Research status, publication status, and deadline state stay separate." action={can(user, "scholarship.create") ? <Button asChild><Link href="/scholarships/new">Add scholarship</Link></Button> : null} />
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_14rem_14rem]">
        <Suspense><SearchBox placeholder="Search name or provider" /></Suspense>
        <Suspense><FilterSelect name="country" label="Country" value={query.filters.country} options={countryOptions} /></Suspense>
        <Suspense><FilterSelect name="research" label="Research" value={query.filters.research} options={["new", "researching", "fact_checking", "verified", "needs_correction", "rejected"].map((value) => ({ value, label: value.replaceAll("_", " ") }))} /></Suspense>
      </div>
      {data.rows.length === 0 ? (
        <EmptyState title="No scholarships yet" body="Add a scholarship from an official source, or adjust the filters." />
      ) : (
        <>
        <div className="grid gap-2 md:hidden">
          {data.rows.map((row) => {
            const state = deadlineState({ openingDate: row.openingDate as string | null, closingDate: row.closingDate as string | null });
            return (
              <RecordCard key={String(row.id)} href={`/scholarships/${row.id}`} title={String(row.name)} meta={`${String(row.provider)} · ${String(row.countryName)}`}>
                <span className="flex flex-wrap gap-1.5">
                  <Badge tone={statusTone(String(row.researchStatus))}>{String(row.researchStatus).replaceAll("_", " ")}</Badge>
                  <Badge tone={statusTone(String(row.publicationStatus))}>{String(row.publicationStatus).replaceAll("_", " ")}</Badge>
                  <Badge tone={statusTone(state)}>{deadlineLabel(state)}</Badge>
                </span>
              </RecordCard>
            );
          })}
        </div>
        <div className="data-sheet table-scroll hidden md:block">
          <table className="data-table min-w-[860px]">
            <thead><tr><th>Name</th><th>Provider</th><th>Country</th><th>Research</th><th>Publication</th><th>Deadline</th></tr></thead>
            <tbody>
              {data.rows.map((row) => {
                const state = deadlineState({ openingDate: row.openingDate as string | null, closingDate: row.closingDate as string | null });
                return (
                  <tr key={String(row.id)}>
                    <td><Link className="font-medium text-primary" href={`/scholarships/${row.id}`}>{String(row.name)}</Link></td>
                    <td>{String(row.provider)}</td>
                    <td>{String(row.countryName)}</td>
                    <td><Badge tone={statusTone(String(row.researchStatus))}>{String(row.researchStatus).replaceAll("_", " ")}</Badge></td>
                    <td><Badge tone={statusTone(String(row.publicationStatus))}>{String(row.publicationStatus).replaceAll("_", " ")}</Badge></td>
                    <td><Badge tone={statusTone(state)}>{deadlineLabel(state)}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
      <Pager page={data.page} hasMore={data.hasMore} path="/scholarships" query={{ q: query.q, country: query.filters.country, research: query.filters.research }} />
    </div>
  );
}
