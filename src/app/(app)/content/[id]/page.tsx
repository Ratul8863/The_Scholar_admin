import { getContent } from "@/server/services/content";
import { transitionContentAction } from "@/server/actions/mutations";
import { CONTENT_STATUSES, canTransition } from "@/server/domain/workflow";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";
import { titleCaseStatus } from "@/lib/utils";

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let content: Record<string, unknown>;
  try {
    content = await getContent(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const status = String(content.contentStatus);
  const next = CONTENT_STATUSES.filter((item) => canTransition(status, item));
  return (
    <div className="space-y-4">
      <PageHeader title={String(content.title)} description={titleCaseStatus(status)} />
      <SectionCard title="Workflow">
        <p className="mb-3 text-sm text-muted">Moving to Ready to publish does not publish the item.</p>
        <div className="flex flex-wrap gap-2">
          {next.map((item) => (
            <form key={item} action={async () => { "use server"; await transitionContentAction(id, item, Number(content.version ?? 1)); }}>
              <Button type="submit" variant={item === "published" ? "primary" : "secondary"} size="sm">{item === "published" ? "Publish" : titleCaseStatus(item)}</Button>
            </form>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Reference">
        <p className="text-sm">{String(content.relatedEntityType)} · {String(content.relatedEntityId)}</p>
        {content.publicUrl ? <a className="text-sm text-primary" href={String(content.publicUrl)}>{String(content.publicUrl)}</a> : <p className="text-sm text-muted">No public URL yet.</p>}
      </SectionCard>
    </div>
  );
}
