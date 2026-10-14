import "server-only";
import { DailyWorkEntry } from "@/models/platform";
import { AppError } from "@/lib/errors";
import { asRecord } from "@/lib/serialize";
import type { CurrentUser } from "@/server/auth/current-user";
import { oid, ready } from "@/server/services/query";

export async function addDailyEntry(user: CurrentUser, input: Record<string, unknown>) {
  await ready();
  const title = String(input.title ?? "").trim();
  const workDate = String(input.workDate ?? new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) throw new AppError("validation", "Choose a valid date.");
  if (!title) throw new AppError("validation", "Describe the work or note.");
  const entryType = input.entryType === "note" ? "note" : "work";
  const doc = await DailyWorkEntry.create({
    userId: oid(user.id),
    workDate,
    entryType,
    category: String(input.category ?? "general"),
    title,
    notes: String(input.notes ?? ""),
    durationMinutes: input.durationMinutes ? Number(input.durationMinutes) : null,
    entityType: String(input.entityType ?? ""),
    entityId: input.entityId ? oid(String(input.entityId)) : null,
  });
  return String(doc._id);
}

export async function productivity(userId: string, month: string) {
  await ready();
  const start = /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7);
  const rows = await DailyWorkEntry.find({ userId: oid(userId), workDate: { $gte: `${start}-01`, $lte: `${start}-31` } }).sort({ workDate: -1 }).lean();
  const entries = rows.map((row) => asRecord(row));
  const minutes = entries.reduce((sum, entry) => sum + Number(entry.durationMinutes ?? 0), 0);
  const byWeek = new Map<string, { entries: number; minutes: number }>();
  for (const entry of entries) {
    const date = new Date(`${entry.workDate}T00:00:00Z`);
    const weekStart = new Date(date);
    weekStart.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const key = weekStart.toISOString().slice(0, 10);
    const current = byWeek.get(key) ?? { entries: 0, minutes: 0 };
    current.entries += 1;
    current.minutes += Number(entry.durationMinutes ?? 0);
    byWeek.set(key, current);
  }
  return {
    month: start,
    entries,
    minutes,
    weeks: [...byWeek.entries()].map(([week, value]) => ({ week, ...value })),
  };
}
