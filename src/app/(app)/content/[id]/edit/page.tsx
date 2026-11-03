import { notFound } from "next/navigation";
import { getContent } from "@/server/services/content";
import { assertPermission, getCurrentUser } from "@/server/auth/current-user";
import { EntityCreateForm } from "@/features/forms/entity-create-form";
import { PageHeader } from "@/components/layout/page";
import { dateInputValue, stringField } from "@/lib/record-defaults";
import { AppError } from "@/lib/errors";

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  assertPermission(user, "content.update");
  const { id } = await params;
  let content: Record<string, unknown>;
  try {
    content = await getContent(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  return (
    <div>
      <PageHeader title="Edit content" />
      <EntityCreateForm
        kind="content"
        redirectTo={`/content/${id}`}
        defaults={{
          id,
          version: stringField(content.version ?? 1),
          title: stringField(content.title),
          contentType: stringField(content.contentType),
          relatedEntityType: stringField(content.relatedEntityType),
          relatedEntityId: stringField(content.relatedEntityId),
          plannedDate: dateInputValue(content.plannedDate),
          notes: stringField(content.notes),
        }}
      />
    </div>
  );
}
