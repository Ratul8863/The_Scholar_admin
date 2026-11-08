import Link from "next/link";
import { notFound } from "next/navigation";
import { getScholarship } from "@/server/services/scholarships";
import { completeness, REQUIRED_FIELDS } from "@/server/domain/completeness";
import { deadlineLabel, deadlineState, daysRemaining } from "@/server/domain/deadlines";
import { AppError } from "@/lib/errors";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { Badge, statusTone } from "@/components/ui/badge";
import { addNoteAction, addSourceAction, archiveScholarshipAction } from "@/server/actions/mutations";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { Note, Source } from "@/models/platform";
import { oid } from "@/server/services/query";
import { listCatalog } from "@/server/services/settings";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCard } from "@/components/ui/card";
import { RecordActions } from "@/components/records/record-actions";

export default async function ScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let record: Record<string, unknown>;
  try {
    record = await getScholarship(id);
  } catch (error) {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  }
  const user = await getCurrentUser();
  const score = completeness(record, [...REQUIRED_FIELDS.scholarship], (record.fieldAvailability as Record<string, "unknown" | "not_public">) ?? {});
  const state = deadlineState({ openingDate: record.openingDate as string | null, closingDate: record.closingDate as string | null, timeZone: String(record.timezone ?? "UTC") });
  const [notes, sources, degrees] = await Promise.all([
    Note.find({ entityType: "scholarship", entityId: oid(id) }).sort({ createdAt: -1 }).lean(),
    Source.find({ entityType: "scholarship", entityId: oid(id) }).lean(),
    listCatalog("degreeLevels"),
  ]);
  const eligibility = (record.eligibility ?? {}) as Record<string, unknown>;
  const funding = (record.funding ?? {}) as Record<string, unknown>;
  const degreeNames = degrees
    .filter((row) => Array.isArray(record.degreeLevelIds) && record.degreeLevelIds.map(String).includes(String(row.id)))
    .map((row) => String(row.name));
  const stipend = String(funding.stipendRange || "").trim() || (funding.monthlyStipend == null ? "" : String(funding.monthlyStipend));
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Scholarship"
        title={String(record.name)}
        description={String(record.provider)}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <RecordActions
              editHref={`/scholarships/${id}/edit`}
              canEdit={can(user, "scholarship.update")}
              canArchive={can(user, "record.archive")}
              archiveLabel="Archive scholarship"
              afterArchiveHref="/scholarships"
              onArchive={archiveScholarshipAction.bind(null, id)}
            />
            <Button asChild variant="outline"><Link href="/scholarships">Back to list</Link></Button>
          </div>
        }
      />
      <div className="flex flex-wrap gap-2">
        <Badge tone={statusTone(String(record.researchStatus))}>{String(record.researchStatus).replaceAll("_", " ")}</Badge>
        <Badge tone={statusTone(String(record.publicationStatus))}>{String(record.publicationStatus).replaceAll("_", " ")}</Badge>
        <Badge tone={statusTone(state)}>{deadlineLabel(state)}</Badge>
        <Badge tone="teal">Completeness {score.percent}%</Badge>
        <span className="text-sm text-muted">{daysRemaining({ closingDate: record.closingDate as string | null, timeZone: String(record.timezone ?? "UTC") }) ?? "No closing date"} days remaining</span>
      </div>
      {score.missing.length ? <AlertCard tone="warning" title="Missing required information">{score.missing.join(", ")}</AlertCard> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Overview">
          <dl className="grid gap-2 text-sm">
            <div><dt className="text-muted">Degree level</dt><dd>{degreeNames.length ? degreeNames.join(", ") : "Not verified"}</dd></div>
            <div><dt className="text-muted">Stipend range</dt><dd>{stipend || "Not verified"}</dd></div>
            <div><dt className="text-muted">Official link</dt><dd className="break-all">{record.officialUrl ? <a className="text-primary" href={String(record.officialUrl)}>{String(record.officialUrl)}</a> : "Not verified"}</dd></div>
            <div><dt className="text-muted">Application link</dt><dd className="break-all">{record.applicationUrl ? String(record.applicationUrl) : "Not verified"}</dd></div>
          </dl>
        </SectionCard>
        <SectionCard title="Eligibility">
          <p className="text-sm">{String(eligibility.summary || "Not verified")}</p>
          <p className="mt-2 text-sm text-muted">Bangladesh eligible: {String(eligibility.bangladeshEligible ?? "unknown")}</p>
        </SectionCard>
        <SectionCard title="Sources">
          <ul className="mb-3 space-y-1 text-sm">{sources.map((source) => <li key={String(source._id)}><a className="text-primary" href={source.url}>{source.sourceName}</a></li>)}</ul>
          <form action={addSourceAction} className="grid gap-2">
            <input type="hidden" name="entityType" value="scholarship" />
            <input type="hidden" name="entityId" value={id} />
            <Input name="sourceName" placeholder="Source name" required />
            <Input name="url" type="url" placeholder="https://" required />
            <Select name="sourceType" aria-label="Source type" options={[{ value: "official", label: "Official" }, { value: "secondary", label: "Secondary" }]} />
            <Button type="submit" size="sm">Add source</Button>
          </form>
        </SectionCard>
        <SectionCard title="Notes">
          <ul className="mb-3 space-y-2 text-sm">{notes.map((note) => <li key={String(note._id)}><span className="text-muted">{note.category}: </span>{note.body}</li>)}</ul>
          <form action={addNoteAction} className="grid gap-2">
            <input type="hidden" name="entityType" value="scholarship" />
            <input type="hidden" name="entityId" value={id} />
            <Select name="category" aria-label="Note category" options={[{ value: "general", label: "General" }, { value: "internal", label: "Internal" }, { value: "research", label: "Research" }, { value: "important", label: "Important" }, { value: "additional", label: "Additional" }]} />
            <Textarea name="body" placeholder="Write a research note" required />
            <Button type="submit" size="sm">Add note</Button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
