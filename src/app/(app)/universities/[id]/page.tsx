import Link from "next/link";
import { notFound } from "next/navigation";
import { getUniversity } from "@/server/services/universities";
import { AppError } from "@/lib/errors";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { saveRankingAction } from "@/server/actions/mutations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RecordCard } from "@/components/ui/card";

export default async function UniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let university: Record<string, unknown>;
  try {
    university = await getUniversity(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const programs = (university.programs as Record<string, unknown>[]) ?? [];
  const rankings = (university.rankings as Record<string, unknown>[]) ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title={String(university.name)} description={`${university.city || "City not verified"} · ${university.universityType || "Type not verified"}`} action={<Button asChild><Link href={`/universities/${id}/programs/new`}>Add program</Link></Button>} />
      <SectionCard title="Programs">
        {programs.length === 0 ? <p className="text-sm text-muted">No programs yet.</p> : <div className="grid gap-2">{programs.map((program) => <RecordCard key={String(program.id)} href={`/universities/programs/${program.id}`} title={String(program.name)} />)}</div>}
      </SectionCard>
      <SectionCard title="Rankings">
        <ul className="mb-3 space-y-1 text-sm">{rankings.length === 0 ? <li className="text-muted">No sourced rankings.</li> : rankings.map((ranking) => <li key={String(ranking.id)}>{String(ranking.organization)} {String(ranking.year ?? "")}: {String(ranking.overallRank || "Not verified")}</li>)}</ul>
        <form action={async (formData) => { "use server"; await saveRankingAction({ universityId: id, organization: formData.get("organization"), year: formData.get("year"), overallRank: formData.get("overallRank"), sourceUrl: formData.get("sourceUrl") }); }} className="grid gap-2 sm:grid-cols-2">
          <Input name="organization" placeholder="Ranking organization" required />
          <Input name="year" placeholder="Year" />
          <Input name="overallRank" placeholder="Overall rank" />
          <Input name="sourceUrl" type="url" placeholder="Source URL" required />
          <Button type="submit" size="sm">Add sourced ranking</Button>
        </form>
      </SectionCard>
    </div>
  );
}
