import Link from "next/link";
import { listProfessorUniversities } from "@/server/services/professors";
import { PageHeader, EmptyState } from "@/components/layout/page";
import { RecordCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ProfessorCountryPage({ params }: { params: Promise<{ countryId: string }> }) {
  const { countryId } = await params;
  const rows = await listProfessorUniversities(countryId);
  return (
    <div>
      <PageHeader title="Professor-research universities" action={<Button asChild><Link href={`/professors/countries/${countryId}/new`}>Add university</Link></Button>} />
      {rows.length === 0 ? <EmptyState title="No professor-research universities" body="Adding one here does not create a main university." /> : (
        <div className="grid gap-2 sm:grid-cols-2">{rows.map((row) => <RecordCard key={String(row.id)} href={`/professors/universities/${row.id}`} title={String(row.name)} />)}</div>
      )}
    </div>
  );
}
