import "server-only";
import { AppError } from "@/lib/errors";
import { Assignment, CustomFieldDefinition, Deadline, Note, Source, User } from "@/models";
import { validateCustomFields, type CustomFieldDefinition as CustomFieldRule } from "@/server/domain/custom-fields";
import { safeHttpUrl } from "@/server/domain/text";
import { writeAudit, type AuditChange } from "@/server/services/audit";
import { notifyUser } from "@/server/services/notify";
import { oid, ready } from "@/server/services/query";
import type { CurrentUser } from "@/server/auth/current-user";

export function cleanUrl(value: unknown, allowEmpty = true) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    if (allowEmpty) return "";
    throw new AppError("validation", "A URL is required.");
  }
  const result = safeHttpUrl(text);
  if (!result) throw new AppError("validation", "Enter a valid URL.");
  if ("error" in result) throw new AppError("validation", result.error ?? "Enter a valid URL.");
  return result.url;
}

export function cleanDate(value: unknown) {
  if (!value || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new AppError("validation", "Enter a valid date.");
  return date;
}

export async function customValues(entityType: string, values: Record<string, unknown> | undefined) {
  await ready();
  const definitions = await CustomFieldDefinition.find({ entityType, active: true }).lean();
  const rules: CustomFieldRule[] = definitions.map((definition) => ({
    fieldKey: definition.fieldKey,
    label: definition.label,
    type: definition.type as CustomFieldRule["type"],
    required: definition.required,
    options: definition.options,
    active: definition.active,
  }));
  const result = validateCustomFields(rules, values);
  if (!result.ok) throw new AppError("validation", "Check the custom fields.", result.errors);
  return result.normalized;
}

export async function syncDeadline(input: {
  entityType: string;
  entityId: string;
  deadlineType: string;
  label: string;
  openingDate?: Date | null;
  closingDate?: Date | null;
  timezone?: string;
  sourceUrl?: string;
  countryId?: string | null;
  subEntityType?: string;
  subEntityId?: string | null;
}) {
  await ready();
  await Deadline.findOneAndUpdate(
    {
      entityType: input.entityType,
      entityId: oid(input.entityId),
      deadlineType: input.deadlineType,
      subEntityId: input.subEntityId ? oid(input.subEntityId) : null,
    },
    {
      $set: {
        label: input.label,
        openingDate: input.openingDate ?? null,
        closingDate: input.closingDate ?? null,
        timezone: input.timezone || "UTC",
        sourceUrl: input.sourceUrl ?? "",
        countryId: input.countryId ? oid(input.countryId) : null,
        subEntityType: input.subEntityType ?? "",
        archivedAt: null,
      },
    },
    { upsert: true },
  );
}

export async function archiveDeadlines(entityType: string, entityId: string) {
  await Deadline.updateMany({ entityType, entityId: oid(entityId) }, { $set: { archivedAt: new Date() } });
}

export async function addNote(user: CurrentUser, entityType: string, entityId: string, category: string, body: string) {
  await ready();
  const allowed = ["general", "internal", "research", "important", "additional"];
  if (!allowed.includes(category)) throw new AppError("validation", "Choose a note category.");
  if (!body.trim()) throw new AppError("validation", "Write a note before saving.");
  const note = await Note.create({
    entityType,
    entityId: oid(entityId),
    category,
    body: body.trim(),
    authorId: oid(user.id),
  });
  await writeAudit({ actorUserId: user.id, action: "edit", entityType, entityId, metadata: { note: category } });
  return note;
}

export async function addSource(
  user: CurrentUser,
  input: { entityType: string; entityId: string; sourceName: string; sourceType: string; url: string; description?: string },
) {
  await ready();
  const source = await Source.create({
    ...input,
    entityId: oid(input.entityId),
    url: cleanUrl(input.url, false),
    description: input.description ?? "",
    createdBy: oid(user.id),
  });
  await writeAudit({
    actorUserId: user.id,
    action: "edit",
    entityType: input.entityType,
    entityId: input.entityId,
    changes: [{ field: "source", oldValue: null, newValue: input.url }],
  });
  return source;
}

export async function assignUser(
  actor: CurrentUser,
  input: { entityType: string; entityId: string; assignmentType: string; userId: string; href: string; label: string },
) {
  await ready();
  const assignee = await User.findOne({ _id: oid(input.userId, "user"), active: true }).lean();
  if (!assignee) throw new AppError("validation", "Choose an active team member.");
  const allowed = ["researcher", "verifier", "content_manager", "designer", "editor", "publisher"];
  if (!allowed.includes(input.assignmentType)) throw new AppError("validation", "Unknown assignment type.");
  await Assignment.findOneAndUpdate(
    {
      entityType: input.entityType,
      entityId: oid(input.entityId),
      assignmentType: input.assignmentType,
      userId: assignee._id,
      status: "active",
    },
    { $setOnInsert: { assignedBy: oid(actor.id), assignedAt: new Date() } },
    { upsert: true },
  );
  await writeAudit({
    actorUserId: actor.id,
    action: "assign",
    entityType: input.entityType,
    entityId: input.entityId,
    changes: [{ field: input.assignmentType, oldValue: null, newValue: assignee.email }],
  });
  await notifyUser({
    userId: String(assignee._id),
    category: input.assignmentType === "designer" ? "designer_assignment" : "assignment",
    title: `Assigned: ${input.label}`,
    body: `You were assigned as ${input.assignmentType.replaceAll("_", " ")}.`,
    href: input.href,
    notificationKey: `assign:${input.entityType}:${input.entityId}:${input.assignmentType}:${assignee._id}`,
  });
}

export async function recordChanges(user: CurrentUser, entityType: string, entityId: string, action: string, changes: AuditChange[], metadata?: Record<string, unknown>) {
  if (action === "edit" && changes.length === 0) return;
  await writeAudit({ actorUserId: user.id, action, entityType, entityId, changes, metadata });
}
