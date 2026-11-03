import Link from "next/link";
import { getProfessor } from "@/server/services/professors";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { archiveProfessorAction, savePublicationAction } from "@/server/actions/mutations";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { RecordActions } from "@/components/records/record-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";

function fact(value: unknown) {
  if (value == null || value === "") return "Not verified";
  return String(value);
}

export default async function ProfessorRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let professor: Record<string, unknown>;
  try {
    professor = await getProfessor(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const user = await getCurrentUser();
  const publications = (professor.publications as Record<string, unknown>[]) ?? [];
  const departmentId = String(professor.departmentId ?? "");
  return (
    <div className="space-y-4">
      <PageHeader
        title={String(professor.name)}
        description={fact(professor.designation)}
        action={
          <RecordActions
            editHref={`/professors/records/${id}/edit`}
            canEdit={can(user, "professor.update")}
            canArchive={can(user, "record.archive")}
            afterArchiveHref={departmentId ? `/professors/departments/${departmentId}` : "/professors/table"}
            onArchive={async () => archiveProfessorAction(id)}
          />
        }
      />
      <SectionCard title="Research">
        <p className="text-sm"><span className="text-muted">Email: </span>{fact(professor.email)}</p>
        <p className="mt-2 text-sm"><span className="text-muted">Areas: </span>{Array.isArray(professor.researchAreas) && professor.researchAreas.length ? professor.researchAreas.map(String).join(", ") : "Not verified"}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm [overflow-wrap:anywhere]"><span className="text-muted">Recent: </span>{fact(professor.recentResearch)}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm [overflow-wrap:anywhere]"><span className="text-muted">Previous: </span>{fact(professor.previousResearch)}</p>
        <p className="mt-2 text-sm"><span className="text-muted">Profile: </span>{professor.officialProfile ? <a className="break-all text-primary" href={String(professor.officialProfile)}>{String(professor.officialProfile)}</a> : "Not publicly available"}</p>
        <p className="mt-2 text-sm"><span className="text-muted">Lab: </span>{fact(professor.labName)} {professor.labUrl ? <a className="break-all text-primary" href={String(professor.labUrl)}>{String(professor.labUrl)}</a> : null}</p>
      </SectionCard>
      <SectionCard title="Publications">
        <ul className="mb-3 text-sm">{publications.length === 0 ? <li className="text-muted">No publications recorded.</li> : publications.map((item) => <li key={String(item.id)}>{String(item.title)}{item.year ? ` (${String(item.year)})` : ""}</li>)}</ul>
        {can(user, "professor.update") ? (
          <form action={async (formData) => { "use server"; await savePublicationAction({ professorId: id, title: formData.get("title"), year: formData.get("year"), venue: formData.get("venue"), url: formData.get("url") }); }} className="grid gap-2 sm:grid-cols-2">
            <Input name="title" placeholder="Publication title" required />
            <Input name="year" placeholder="Year" />
            <Input name="venue" placeholder="Venue" />
            <Input name="url" type="url" placeholder="URL" />
            <Button type="submit" size="sm">Add publication</Button>
          </form>
        ) : null}
      </SectionCard>
      {departmentId ? <Button asChild variant="outline" size="sm"><Link href={`/professors/departments/${departmentId}`} prefetch={false}>Back to department</Link></Button> : null}
    </div>
  );
}
