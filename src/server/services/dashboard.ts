import "server-only";
import { ActivityLog, Content, DailyWorkEntry, Deadline, EmergencyUpdate, Opportunity, Professor, Scholarship, University } from "@/models";
import { Country } from "@/models/reference";
import { Assignment } from "@/models/platform";
import { asRecord } from "@/lib/serialize";
import { cacheLoad } from "@/server/cache";
import { deadlineState } from "@/server/domain/deadlines";
import { ready } from "@/server/services/query";
import { getSettings } from "@/server/services/settings";

export async function dashboardData() {
  return cacheLoad("dashboard", computeDashboard, 45_000);
}

async function computeDashboard() {
  await ready();
  const settings = await getSettings();
  const now = new Date();
  const [
    scholarships,
    universities,
    professors,
    countries,
    opportunities,
    emergencies,
    activity,
    contentCounts,
    deadlines,
    assignments,
    work,
  ] = await Promise.all([
    Scholarship.countDocuments({ archivedAt: null }),
    University.countDocuments({ archivedAt: null }),
    Professor.countDocuments({ archivedAt: null }),
    Country.countDocuments({ active: true }),
    Opportunity.countDocuments({ archivedAt: null }),
    EmergencyUpdate.countDocuments({ archivedAt: null, urgency: "emergency" }),
    ActivityLog.find().sort({ timestamp: -1 }).limit(8).select("action entityType timestamp").lean(),
    Content.aggregate([{ $match: { archivedAt: null } }, { $group: { _id: "$contentStatus", count: { $sum: 1 } } }]),
    Deadline.find({
      archivedAt: null,
      closingDate: { $gte: now, $lte: new Date(now.getTime() + 62 * 86_400_000) },
    })
      .select("closingDate timezone")
      .lean(),
    Assignment.aggregate([{ $match: { status: "active" } }, { $group: { _id: "$userId", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
    DailyWorkEntry.countDocuments({ workDate: now.toISOString().slice(0, 10) }),
  ]);
  const counts = Object.fromEntries(contentCounts.map((row) => [String(row._id), row.count as number]));
  const content = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const buckets = { next5: 0, next7: 0, next30: 0, next60: 0 };
  for (const deadline of deadlines) {
    const state = deadlineState({ closingDate: deadline.closingDate, timeZone: deadline.timezone, warningDays: settings.deadlineWarningDays, now });
    if (state === "closed" || state === "unknown" || !deadline.closingDate) continue;
    const days = Math.ceil((new Date(deadline.closingDate).getTime() - now.getTime()) / 86_400_000);
    if (days <= 5) buckets.next5 += 1;
    if (days <= 7) buckets.next7 += 1;
    if (days <= 30) buckets.next30 += 1;
    if (days <= 60) buckets.next60 += 1;
  }
  return {
    metrics: {
      scholarships,
      universities,
      professors,
      countries,
      opportunities,
      content,
      published: counts.published ?? 0,
      readyToPublish: counts.ready_to_publish ?? 0,
      emergencies,
      work,
    },
    buckets,
    contentCounts: counts,
    activity: activity.map((row) => asRecord(row)),
    workload: assignments.map((row) => ({ userId: String(row._id), count: row.count as number })),
  };
}
