import "server-only";
import { Deadline } from "@/models/platform";
import { asRecord } from "@/lib/serialize";
import { deadlineState, daysRemaining, daysUntilOpening } from "@/server/domain/deadlines";
import { ready } from "@/server/services/query";
import { getSettings } from "@/server/services/settings";

export async function listDeadlines(bucket: string) {
  await ready();
  const settings = await getSettings();
  const now = new Date();
  const filter: Record<string, unknown> = { archivedAt: null };
  const day = 86_400_000;
  if (bucket === "past") filter.closingDate = { $lt: now };
  else if (bucket === "opening") filter.openingDate = { $gte: now, $lte: new Date(now.getTime() + settings.openingSoonDays * day) };
  else {
    const days = bucket === "5" ? 5 : bucket === "7" ? 7 : bucket === "60" ? 60 : 30;
    filter.closingDate = { $gte: now, $lte: new Date(now.getTime() + days * day) };
  }
  const rows = await Deadline.find(filter).sort({ closingDate: 1, openingDate: 1 }).limit(100).lean();
  return rows.map((row) => ({
    ...asRecord(row),
    state: deadlineState({ openingDate: row.openingDate, closingDate: row.closingDate, timeZone: row.timezone, warningDays: settings.deadlineWarningDays }),
    daysRemaining: daysRemaining({ closingDate: row.closingDate, timeZone: row.timezone }),
    daysUntilOpening: daysUntilOpening({ openingDate: row.openingDate, timeZone: row.timezone }),
    href: hrefFor(row.entityType, String(row.entityId)),
  })) as Record<string, unknown>[];
}

function hrefFor(entityType: string, id: string) {
  if (entityType === "scholarship") return `/scholarships/${id}`;
  if (entityType === "opportunity") return `/opportunities/record/${id}`;
  if (entityType === "program") return `/universities/programs/${id}`;
  if (entityType === "content") return `/content/${id}`;
  if (entityType === "university") return `/universities/${id}`;
  return "/deadlines";
}
