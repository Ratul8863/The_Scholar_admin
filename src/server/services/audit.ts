import "server-only";
import { ActivityLog } from "@/models/platform";
import { connectDB } from "@/server/db/mongoose";

export type AuditChange = {
  field: string;
  oldValue: unknown;
  newValue: unknown;
};

export async function writeAudit(input: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: AuditChange[];
  metadata?: Record<string, unknown>;
}) {
  await connectDB();
  await ActivityLog.create({
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    changes: input.changes ?? [],
    metadata: input.metadata ?? {},
    timestamp: new Date(),
  });
}

export async function listActivity(filters: { entityType?: string; actorUserId?: string; page?: number }) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.entityType) query.entityType = filters.entityType;
  if (filters.actorUserId) query.actorUserId = filters.actorUserId;
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const [rows, total] = await Promise.all([
    ActivityLog.find(query).sort({ timestamp: -1 }).skip((page - 1) * 40).limit(40).lean(),
    ActivityLog.countDocuments(query),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / 40)) };
}

export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>, fields: string[]) {
  const changes: AuditChange[] = [];
  for (const field of fields) {
    const oldValue = before[field] ?? null;
    const newValue = after[field] ?? null;
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) changes.push({ field, oldValue, newValue });
  }
  return changes;
}
