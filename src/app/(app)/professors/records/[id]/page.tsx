import { getProfessor } from "@/server/services/professors";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";

function fact(value: unknown) {
  if (value == null || value === "") return "Not verified";
  return String(value);
}

export default async function ProfessorRecordPage({ params }: { params: Promise<{ id: string }> }) {
  let professor: Record<string, unknown>;
  try {
    professor = await getProfessor((await params).id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const publications = (professor.publications as Record<string, unknown>[]) ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title={String(professor.name)} description={fact(professor.designation)} />
      <SectionCard title="Research">
        <p className="text-sm"><span className="text-muted">Email: </span>{fact(professor.email)}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm"><span className="text-muted">Recent: </span>{fact(professor.recentResearch)}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm"><span className="text-muted">Previous: </span>{fact(professor.previousResearch)}</p>
        <p className="mt-2 text-sm"><span className="text-muted">Profile: </span>{professor.officialProfile ? <a className="text-primary" href={String(professor.officialProfile)}>{String(professor.officialProfile)}</a> : "Not publicly available"}</p>
      </SectionCard>
      <SectionCard title="Publications">
        <ul className="text-sm">{publications.length === 0 ? <li className="text-muted">No publications recorded.</li> : publications.map((item) => <li key={String(item.id)}>{String(item.title)}</li>)}</ul>
      </SectionCard>
    </div>
  );
}
