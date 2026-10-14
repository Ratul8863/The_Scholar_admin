import Link from "next/link";
import { universitiesForCountry } from "@/server/services/universities";
import { Country } from "@/models/reference";
import { oid, ready } from "@/server/services/query";
import { PageHeader, EmptyState } from "@/components/layout/page";
import { RecordCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CountryUniversitiesPage({ params }: { params: Promise<{ countryId: string }> }) {
  const { countryId } = await params;
  await ready();
  const country = await Country.findById(oid(countryId)).lean();
  const rows = await universitiesForCountry(countryId);
  return (
    <div>
      <PageHeader title={country?.name ?? "Country"} description="Universities in the main admissions hierarchy." action={<Button asChild><Link href={`/universities/new?country=${countryId}`}>Add university</Link></Button>} />
      {rows.length === 0 ? <EmptyState title="No universities in this country" body="Create the first university when you have an official source." /> : (
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map((row) => <RecordCard key={String(row.id)} href={`/universities/${row.id}`} title={String(row.name)} meta={String(row.city || "City not verified")} />)}
        </div>
      )}
    </div>
  );
}
