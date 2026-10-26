import "server-only";
import { Content, EmergencyUpdate, Opportunity, Scholarship, University } from "@/models";
import { Deadline } from "@/models/platform";
import { AppError } from "@/lib/errors";
import { asRecord } from "@/lib/serialize";
import type { CurrentUser } from "@/server/auth/current-user";
import { assertAnyPermission } from "@/server/auth/current-user";
import { deadlineState, daysRemaining, daysUntilOpening } from "@/server/domain/deadlines";
import { canTransition, permissionsForTransition } from "@/server/domain/workflow";
import { writeAudit } from "@/server/services/audit";
import { cleanDate, cleanUrl, syncDeadline } from "@/server/services/relations";
import { notifyUser } from "@/server/services/notify";
import { oid, ready, saveUpdate, type DocModel } from "@/server/services/query";
import { getSettings } from "@/server/services/settings";

const contents = Content as unknown as DocModel;

export async function saveContent(user: CurrentUser, input: Record<string, unknown>) {
  await ready();
  const title = String(input.title ?? "").trim();
  if (title.length < 2) throw new AppError("validation", "Enter a content title.");
  const data = {
    title,
    contentType: String(input.contentType ?? "").trim() || "update",
    relatedEntityType: String(input.relatedEntityType ?? ""),
    relatedEntityId: oid(String(input.relatedEntityId)),
    countryId: input.countryId ? oid(String(input.countryId)) : null,
    contentStatus: String(input.contentStatus ?? "idea"),
    assignedResearcherId: input.assignedResearcherId ? oid(String(input.assignedResearcherId)) : null,
    designerId: input.designerId ? oid(String(input.designerId)) : null,
    editorId: input.editorId ? oid(String(input.editorId)) : null,
    publisherId: input.publisherId ? oid(String(input.publisherId)) : null,
    plannedDate: cleanDate(input.plannedDate),
    readyDate: cleanDate(input.readyDate),
    publicUrl: cleanUrl(input.publicUrl),
    notes: String(input.notes ?? ""),
    updatedBy: oid(user.id),
  };
  if (!input.id && data.contentStatus !== "idea") data.contentStatus = "idea";
  const id = input.id
    ? String((await saveUpdate(contents, String(input.id), Number(input.version), data)) && input.id)
    : String((await Content.create({ ...data, createdBy: oid(user.id) }))._id);
  if (data.plannedDate) {
    await syncDeadline({
      entityType: "content",
      entityId: id,
      deadlineType: "planned",
      label: title,
      openingDate: null,
      closingDate: data.plannedDate,
      countryId: input.countryId ? String(input.countryId) : null,
    });
  }
  await writeAudit({ actorUserId: user.id, action: input.id ? "edit" : "create", entityType: "content", entityId: id });
  return id;
}

export async function transitionContent(user: CurrentUser, id: string, to: string, version: number) {
  await ready();
  assertAnyPermission(user, permissionsForTransition(to));
  const current = await Content.findOne({ _id: oid(id), archivedAt: null }).lean();
  if (!current) throw new AppError("not_found", "Content was not found.");
  if (!canTransition(current.contentStatus, to)) {
    throw new AppError("validation", "That workflow move is not allowed from the current status.");
  }
  const patch: Record<string, unknown> = { contentStatus: to, updatedBy: oid(user.id) };
  if (to === "ready_to_publish") patch.readyDate = new Date();
  if (to === "published") {
    patch.publishedDate = new Date();
    patch.publisherId = oid(user.id);
  }
  await saveUpdate(contents, id, version, patch);
  await writeAudit({
    actorUserId: user.id,
    action: to === "published" ? "publish" : to === "unpublished" ? "unpublish" : "edit",
    entityType: "content",
    entityId: id,
    changes: [{ field: "contentStatus", oldValue: current.contentStatus, newValue: to }],
  });
  if (to === "ready_to_publish") {
    const target = current.editorId ?? current.assignedResearcherId;
    if (target) {
      await notifyUser({
        userId: String(target),
        category: "ready_to_publish",
        title: `Ready to publish: ${current.title}`,
        href: `/content/${id}`,
        notificationKey: `ready:${id}:${version}`,
      });
    }
  }
}

export async function contentWorkspace(user: CurrentUser) {
  await ready();
  const settings = await getSettings();
  const now = new Date();
  const soon = new Date(now.getTime() + settings.openingSoonDays * 86_400_000);
  const freshAfter = new Date(now.getTime() - settings.newInformationDays * 86_400_000);
  const [emergency, inProgress, readyToPublish, published, deadlines, opening, scholarships, opportunities, universities, emergencies, productivity] = await Promise.all([
    EmergencyUpdate.find({ archivedAt: null }).sort({ urgency: -1, createdAt: -1 }).limit(8).select("title informationType urgency sourceName createdAt").lean(),
    Content.find({ archivedAt: null, contentStatus: { $nin: ["ready_to_publish", "published", "archived"] } }).sort({ updatedAt: -1 }).limit(12).select("title contentStatus updatedAt").lean(),
    Content.find({ archivedAt: null, contentStatus: "ready_to_publish" }).sort({ readyDate: 1 }).limit(12).select("title readyDate").lean(),
    Content.find({ archivedAt: null, contentStatus: "published" }).sort({ publishedDate: -1 }).limit(12).select("title publishedDate").lean(),
    Deadline.find({ archivedAt: null, closingDate: { $gte: now } }).sort({ closingDate: 1 }).limit(40).select("label closingDate openingDate timezone entityType entityId").lean(),
    Deadline.find({ archivedAt: null, openingDate: { $gte: now, $lte: soon } }).sort({ openingDate: 1 }).limit(20).select("label openingDate timezone entityType entityId").lean(),
    Scholarship.find({ archivedAt: null, updatedAt: { $gte: freshAfter } }).sort({ updatedAt: -1 }).limit(8).select("name updatedAt").lean(),
    Opportunity.find({ archivedAt: null, updatedAt: { $gte: freshAfter } }).sort({ updatedAt: -1 }).limit(8).select("name type updatedAt").lean(),
    University.find({ archivedAt: null, updatedAt: { $gte: freshAfter } }).sort({ updatedAt: -1 }).limit(8).select("name updatedAt").lean(),
    EmergencyUpdate.find({ archivedAt: null, createdAt: { $gte: freshAfter } }).sort({ createdAt: -1 }).limit(8).select("title createdAt urgency").lean(),
    Content.aggregate([{ $match: { archivedAt: null } }, { $group: { _id: "$contentStatus", count: { $sum: 1 } } }]),
  ]);
  return {
    viewer: user.name,
    emergency: emergency.map((row) => asRecord(row)),
    deadlines: deadlines.map((row) => ({
      ...asRecord(row),
      state: deadlineState({ openingDate: row.openingDate, closingDate: row.closingDate, timeZone: row.timezone, warningDays: settings.deadlineWarningDays }),
      daysRemaining: daysRemaining({ closingDate: row.closingDate, timeZone: row.timezone }),
    })) as Record<string, unknown>[],
    opening: opening.map((row) => ({
      ...asRecord(row),
      daysUntilOpening: daysUntilOpening({ openingDate: row.openingDate, timeZone: row.timezone }),
    })) as Record<string, unknown>[],
    fresh: [
      ...scholarships.map((row) => ({ id: String(row._id), title: row.name, type: "Scholarship", href: `/scholarships/${row._id}`, updatedAt: row.updatedAt })),
      ...opportunities.map((row) => ({ id: String(row._id), title: row.name, type: row.type, href: `/opportunities/view/${row._id}`, updatedAt: row.updatedAt })),
      ...universities.map((row) => ({ id: String(row._id), title: row.name, type: "University", href: `/universities/${row._id}`, updatedAt: row.updatedAt })),
      ...emergencies.map((row) => ({ id: String(row._id), title: row.title, type: "Emergency", href: `/emergency/${row._id}`, updatedAt: row.createdAt })),
    ].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 12),
    inProgress: inProgress.map((row) => asRecord(row)),
    readyToPublish: readyToPublish.map((row) => asRecord(row)),
    published: published.map((row) => asRecord(row)),
    productivity: Object.fromEntries(productivity.map((row) => [String(row._id), row.count as number])),
  };
}

export async function getContent(id: string) {
  await ready();
  const doc = await Content.findOne({ _id: oid(id), archivedAt: null }).lean();
  if (!doc) throw new AppError("not_found", "Content was not found.");
  return asRecord(doc);
}

export async function listContent(status?: string) {
  await ready();
  const filter: Record<string, unknown> = { archivedAt: null };
  if (status) filter.contentStatus = status;
  const rows = await Content.find(filter).sort({ updatedAt: -1 }).limit(50).select("title contentType contentStatus updatedAt plannedDate").lean();
  return rows.map((row) => asRecord(row));
}
