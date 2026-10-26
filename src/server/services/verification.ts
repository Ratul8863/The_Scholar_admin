import "server-only";
import { EmergencyUpdate, Opportunity, Professor, Scholarship, University, UniversityProgram } from "@/models";
import { VerificationRun, VerificationTemplate } from "@/models/platform";
import { AppError } from "@/lib/errors";
import type { CurrentUser } from "@/server/auth/current-user";
import { verificationProgress, type CheckState } from "@/server/domain/verification";
import { writeAudit } from "@/server/services/audit";
import { notifyUser } from "@/server/services/notify";
import { oid, ready } from "@/server/services/query";

const queues = [
  { entityType: "scholarship", model: Scholarship, title: "name", href: (id: string) => `/scholarships/${id}` },
  { entityType: "university", model: University, title: "name", href: (id: string) => `/universities/${id}` },
  { entityType: "program", model: UniversityProgram, title: "name", href: (id: string) => `/universities/programs/${id}` },
  { entityType: "professor", model: Professor, title: "name", href: (id: string) => `/professors/records/${id}` },
  { entityType: "opportunity", model: Opportunity, title: "name", href: (id: string) => `/opportunities/record/${id}` },
  { entityType: "emergency", model: EmergencyUpdate, title: "title", href: (id: string) => `/emergency/${id}` },
] as const;

export async function verificationQueue() {
  await ready();
  const groups = await Promise.all(
    queues.map(async (queue) => {
      const source = queue.entityType === "emergency"
        ? await EmergencyUpdate.find({ archivedAt: null, verificationStatus: { $ne: "verified" } }).sort({ createdAt: -1 }).limit(8).select("title createdAt").lean()
        : await queue.model.find({ archivedAt: null, researchStatus: { $ne: "verified" } }).sort({ updatedAt: -1 }).limit(8).select("name title updatedAt").lean();
      return source.map((row) => ({
        id: String(row._id),
        entityType: queue.entityType,
        title: String((row as Record<string, unknown>)[queue.title] ?? "Untitled"),
        href: queue.href(String(row._id)),
        updatedAt: (row as { updatedAt?: Date }).updatedAt ?? null,
      }));
    }),
  );
  return groups.flat();
}

export async function verificationDetail(entityType: string, entityId: string) {
  await ready();
  const template = await VerificationTemplate.findOne({ entityType, active: true }).lean();
  const run = await VerificationRun.findOne({ entityType, entityId: oid(entityId) }).sort({ updatedAt: -1 }).lean();
  const items = run?.items?.length
    ? run.items
    : (template?.items ?? []).map((item: { key: string; label: string; required?: boolean }) => ({ ...item, state: "not_checked" as const, note: "" }));
  return {
    templateName: template?.name ?? "Checklist",
    runId: run ? String(run._id) : null,
    verifierId: run?.verifierId ? String(run.verifierId) : "",
    items,
    progress: verificationProgress(items.map((item: { key: string; label?: string; required?: boolean; state?: string }) => ({ key: item.key, label: item.label, required: Boolean(item.required), state: (item.state ?? "not_checked") as CheckState }))),
  };
}

export async function saveVerification(user: CurrentUser, input: Record<string, unknown>) {
  await ready();
  const entityType = String(input.entityType ?? "");
  const entityId = String(input.entityId ?? "");
  const items = Array.isArray(input.items) ? input.items : [];
  const normalized = items.map((item: Record<string, unknown>) => {
    const row = item as Record<string, unknown>;
    const state = String(row.state ?? "not_checked");
    if (!["checked", "not_checked", "needs_correction", "not_applicable"].includes(state)) {
      throw new AppError("validation", "Unknown checklist state.");
    }
    return { key: String(row.key), label: String(row.label ?? row.key), required: row.required === true, state, note: String(row.note ?? "") };
  });
  await VerificationRun.findOneAndUpdate(
    { entityType, entityId: oid(entityId) },
    { $set: { items: normalized, verifierId: oid(user.id), updatedBy: oid(user.id), templateId: null } },
    { upsert: true },
  );
  const progress = verificationProgress(normalized.map((item: { key: string; label: string; required: boolean; state: string }) => ({ ...item, state: item.state as CheckState })));
  await writeAudit({
    actorUserId: user.id,
    action: progress.corrections.length ? "request_correction" : "verify",
    entityType,
    entityId,
    metadata: { percent: progress.percent },
  });
  if (progress.corrections.length && input.assigneeId) {
    await notifyUser({
      userId: String(input.assigneeId),
      category: "correction_request",
      title: "Verification needs correction",
      href: `/verification/${entityType}/${entityId}`,
      notificationKey: `correction:${entityType}:${entityId}:${progress.percent}`,
    });
  }
  return progress;
}
