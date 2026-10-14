import Link from "next/link";
import { notFound } from "next/navigation";
import { getScholarship } from "@/server/services/scholarships";
import { completeness, REQUIRED_FIELDS } from "@/server/domain/completeness";
import { deadlineLabel, deadlineState, daysRemaining } from "@/server/domain/deadlines";
import { AppError } from "@/lib/errors";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { Badge, statusTone } from "@/components/ui/badge";
import { addNoteAction, addSourceAction } from "@/server/actions/mutations";
import { Note, Source } from "@/models/platform";
import { oid } from "@/server/services/query";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCard } from "@/components/ui/card";

export default async function ScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let record: Record<string, unknown>;
  try {
    record = await getScholarship(id);
  } catch (error) {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  }
  const score = completeness(record, [...REQUIRED_FIELDS.scholarship], (record.fieldAvailability as Record<string, "unknown" | "not_public">) ?? {});
  const state = deadlineState({ openingDate: record.openingDate as string | null, closingDate: record.closingDate as string | null, timeZone: String(record.timezone ?? "UTC") });
  const notes = await Note.find({ entityType: "scholarship", entityId: oid(id) }).sort({ createdAt: -1 }).lean();
  const sources = await Source.find({ entityType: "scholarship", entityId: oid(id) }).lean();
  const eligibility = (record.eligibility ?? {}) as Record<string, unknown>;
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Scholarship" title={String(record.name)} description={String(record.provider)} action={<Button asChild variant="outline"><Link href="/scholarships">Back to list</Link></Button>} />
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
            <div><dt className="text-muted">Official link</dt><dd>{record.officialUrl ? <a className="text-primary" href={String(record.officialUrl)}>{String(record.officialUrl)}</a> : "Not verified"}</dd></div>
            <div><dt className="text-muted">Application link</dt><dd>{record.applicationUrl ? String(record.applicationUrl) : "Not verified"}</dd></div>
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
