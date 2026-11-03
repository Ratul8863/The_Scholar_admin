import Link from "next/link";
import { notFound } from "next/navigation";
import { getUniversity } from "@/server/services/universities";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { archiveUniversityAction } from "@/server/actions/mutations";
import { AppError } from "@/lib/errors";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { RecordActions } from "@/components/records/record-actions";
import { RankingForm } from "@/components/records/ranking-form";
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
  const user = await getCurrentUser();
  const programs = (university.programs as Record<string, unknown>[]) ?? [];
  const rankings = (university.rankings as Record<string, unknown>[]) ?? [];
  const countryId = String(university.countryId ?? "");
  return (
    <div className="space-y-4">
      <PageHeader
        title={String(university.name)}
        description={`${university.city || "City not verified"} · ${university.universityType || "Type not verified"}`}
        action={
          <div className="flex flex-wrap gap-2">
            <RecordActions
              editHref={`/universities/${id}/edit`}
              canEdit={can(user, "university.update")}
              canArchive={can(user, "record.archive")}
              afterArchiveHref={countryId ? `/universities/countries/${countryId}` : "/universities"}
              onArchive={archiveUniversityAction.bind(null, id)}
            />
            {can(user, "university.update") ? <Button asChild><Link href={`/universities/${id}/programs/new`} prefetch={false}>Add program</Link></Button> : null}
          </div>
        }
      />
      <SectionCard title="Programs">
        {programs.length === 0 ? <p className="text-sm text-muted">No programs yet.</p> : <div className="grid gap-2">{programs.map((program) => <RecordCard key={String(program.id)} href={`/universities/programs/${program.id}`} title={String(program.name)} />)}</div>}
      </SectionCard>
      <SectionCard title="Rankings">
        <ul className="mb-3 space-y-1 text-sm">{rankings.length === 0 ? <li className="text-muted">No sourced rankings.</li> : rankings.map((ranking) => <li key={String(ranking.id)}>{String(ranking.organization)} {String(ranking.year ?? "")}: {String(ranking.overallRank || "Not verified")}</li>)}</ul>
        {can(user, "university.update") ? <RankingForm universityId={id} /> : null}
      </SectionCard>
    </div>
  );
}
