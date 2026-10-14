import "server-only";
import { EmergencyUpdate, Opportunity } from "@/models";
import { AppError } from "@/lib/errors";
import { asRecord } from "@/lib/serialize";
import type { ListQuery } from "@/lib/query";
import type { CurrentUser } from "@/server/auth/current-user";
import { duplicateAssessment } from "@/server/domain/duplicates";
import { normalizeText, normalizeUrl } from "@/server/domain/text";
import { writeAudit } from "@/server/services/audit";
import { archiveDeadlines, cleanDate, cleanUrl, customValues, syncDeadline } from "@/server/services/relations";
import { notifyUser } from "@/server/services/notify";
import { archiveDoc, countryLookup, oid, paginate, ready, saveUpdate, searchClause, type DocModel } from "@/server/services/query";

const opportunities = Opportunity as unknown as DocModel;
const emergencies = EmergencyUpdate as unknown as DocModel;
const types = new Set(["leadership", "fellowship", "internship"]);

export async function listOpportunities(type: string, query: ListQuery) {
  if (!types.has(type)) throw new AppError("not_found", "That co-curricular section does not exist.");
  await ready();
  const filter: Record<string, unknown> = { type, archivedAt: null, ...searchClause(query, ["name", "organization"]) };
  if (query.filters.country) filter.countryId = oid(query.filters.country);
  if (query.filters.research) filter.researchStatus = query.filters.research;
  const page = await paginate(opportunities, filter, query);
  const countries = await countryLookup(page.rows.map((row) => (row as { countryId?: unknown }).countryId));
  return {
    ...page,
    rows: page.rows.map((row) => {
      const record = asRecord(row);
      return { ...record, countryName: countries.get(String(record.countryId ?? ""))?.name ?? "" } as Record<string, unknown>;
    }),
  };
}

export async function saveOpportunity(user: CurrentUser, input: Record<string, unknown>) {
  await ready();
  const type = String(input.type ?? "");
  if (!types.has(type)) throw new AppError("validation", "Choose leadership, fellowship, or internship.");
  const name = String(input.name ?? "").trim();
  const organization = String(input.organization ?? "").trim();
  if (name.length < 2 || organization.length < 2) throw new AppError("validation", "Name and organization are required.");
  const officialUrl = cleanUrl(input.officialUrl);
  const duplicates = await opportunityDuplicates({ name, organization, countryId: String(input.countryId ?? ""), officialUrl, type }, input.id ? String(input.id) : undefined);
  if (duplicates.length && input.acknowledgeDuplicate !== true) {
    throw new AppError("duplicate", "A possible duplicate opportunity already exists.", { matches: duplicates });
  }
  const data = {
    type,
    name,
    normalizedName: normalizeText(name),
    organization,
    normalizedOrganization: normalizeText(organization),
    countryId: input.countryId ? oid(String(input.countryId)) : null,
    city: String(input.city ?? ""),
    openingDate: cleanDate(input.openingDate),
    closingDate: cleanDate(input.closingDate),
    timezone: String(input.timezone ?? "UTC"),
    eligibility: String(input.eligibility ?? ""),
    requirements: String(input.requirements ?? ""),
    funding: String(input.funding ?? ""),
    fellowship: {
      duration: String(input.duration ?? ""),
      fundingAmount: String(input.fundingAmount ?? ""),
      tuitionCoverage: String(input.tuitionCoverage ?? ""),
      stipend: String(input.stipend ?? ""),
      travel: String(input.travel ?? ""),
      accommodation: String(input.accommodation ?? ""),
    },
    officialUrl,
    normalizedOfficialUrl: officialUrl ? normalizeUrl(officialUrl) : "",
    applicationUrl: cleanUrl(input.applicationUrl),
    researchStatus: String(input.researchStatus ?? "new"),
    publicationStatus: String(input.publicationStatus ?? "not_ready"),
    fieldAvailability: input.fieldAvailability ?? {},
    customFields: await customValues("opportunity", (input.customFields as Record<string, unknown>) ?? {}),
    updatedBy: oid(user.id),
  };
  const id = input.id
    ? String((await saveUpdate(opportunities, String(input.id), Number(input.version), data)) && input.id)
    : String((await Opportunity.create({ ...data, createdBy: oid(user.id) }))._id);
  await syncDeadline({
    entityType: "opportunity",
    entityId: id,
    deadlineType: "application",
    label: name,
    openingDate: data.openingDate,
    closingDate: data.closingDate,
    timezone: data.timezone,
    sourceUrl: officialUrl,
    countryId: input.countryId ? String(input.countryId) : null,
  });
  await writeAudit({ actorUserId: user.id, action: input.id ? "edit" : "create", entityType: "opportunity", entityId: id, metadata: { type } });
  return id;
}

async function opportunityDuplicates(input: { name: string; organization: string; countryId: string; officialUrl: string; type: string }, exceptId?: string) {
  const or: Record<string, unknown>[] = [{ normalizedName: normalizeText(input.name), normalizedOrganization: normalizeText(input.organization) }];
  if (input.officialUrl) or.push({ normalizedOfficialUrl: normalizeUrl(input.officialUrl) });
  const candidates = (await Opportunity.find({ archivedAt: null, type: input.type, $or: or }).limit(8).lean()) as unknown as Record<string, unknown>[];
  return candidates
    .filter((candidate) => String(candidate._id) !== exceptId)
    .filter((candidate) =>
      duplicateAssessment([
        { key: "name", weight: 0.4, kind: "text", strong: true, left: input.name, right: String(candidate.name ?? "") },
        { key: "organization", weight: 0.25, kind: "text", left: input.organization, right: String(candidate.organization ?? "") },
        { key: "country", weight: 0.1, kind: "exact", left: input.countryId, right: String(candidate.countryId ?? "") },
        { key: "url", weight: 0.25, kind: "url", strong: true, left: input.officialUrl, right: String(candidate.officialUrl ?? "") },
      ]).possible,
    )
    .map((candidate) => ({ id: String(candidate._id), name: String(candidate.name) }));
}

export async function getOpportunity(id: string) {
  await ready();
  const doc = await Opportunity.findOne({ _id: oid(id), archivedAt: null }).lean();
  if (!doc) throw new AppError("not_found", "Opportunity was not found.");
  return asRecord(doc);
}

export async function listEmergencies(query: ListQuery) {
  await ready();
  const filter: Record<string, unknown> = { archivedAt: null, ...searchClause(query, ["title", "informationType"]) };
  if (query.filters.urgency) filter.urgency = query.filters.urgency;
  if (query.filters.country) filter.countryId = oid(query.filters.country);
  const page = await paginate(emergencies, filter, { ...query, sort: query.sort === "updatedAt" ? "createdAt" : query.sort });
  return { ...page, rows: page.rows.map((row) => asRecord(row)) };
}

export async function saveEmergency(user: CurrentUser, input: Record<string, unknown>) {
  await ready();
  const title = String(input.title ?? "").trim();
  const information = String(input.information ?? "").trim();
  if (!title || !information) throw new AppError("validation", "Title and information are required.");
  const urgency = String(input.urgency ?? "").trim() || "normal";
  if (!["normal", "high", "emergency"].includes(urgency)) throw new AppError("validation", "Choose a valid urgency.");
  const data = {
    title,
    informationType: String(input.informationType ?? "update"),
    countryId: input.countryId ? oid(String(input.countryId)) : null,
    relatedScholarshipId: input.relatedScholarshipId ? oid(String(input.relatedScholarshipId)) : null,
    relatedUniversityId: input.relatedUniversityId ? oid(String(input.relatedUniversityId)) : null,
    relatedOpportunityId: input.relatedOpportunityId ? oid(String(input.relatedOpportunityId)) : null,
    sourceUrl: cleanUrl(input.sourceUrl),
    sourceName: String(input.sourceName ?? ""),
    information,
    uploadDate: cleanDate(input.uploadDate) ?? new Date(),
    urgency,
    verificationStatus: String(input.verificationStatus ?? "not_checked"),
    contentStatus: String(input.contentStatus ?? "new"),
    fieldAvailability: input.fieldAvailability ?? {},
    customFields: await customValues("emergency", (input.customFields as Record<string, unknown>) ?? {}),
    updatedBy: oid(user.id),
  };
  const id = input.id
    ? String((await saveUpdate(emergencies, String(input.id), Number(input.version), data)) && input.id)
    : String((await EmergencyUpdate.create({ ...data, createdBy: oid(user.id) }))._id);
  await writeAudit({ actorUserId: user.id, action: input.id ? "edit" : "create", entityType: "emergency", entityId: id });
  if (!input.id && urgency === "emergency") {
    await notifyUser({
      userId: user.id,
      category: "emergency_upload",
      title: `Emergency: ${title}`,
      body: "New emergency information is waiting in the content workspace.",
      href: "/content",
      notificationKey: `emergency:${id}`,
    });
  }
  return id;
}

export async function getEmergency(id: string) {
  await ready();
  const doc = await EmergencyUpdate.findOne({ _id: oid(id), archivedAt: null }).lean();
  if (!doc) throw new AppError("not_found", "Emergency update was not found.");
  return asRecord(doc);
}

export async function archiveOpportunity(user: CurrentUser, id: string) {
  await archiveDoc(opportunities, id, user.id);
  await archiveDeadlines("opportunity", id);
  await writeAudit({ actorUserId: user.id, action: "archive", entityType: "opportunity", entityId: id });
}

export async function archiveEmergency(user: CurrentUser, id: string) {
  await archiveDoc(emergencies, id, user.id);
  await writeAudit({ actorUserId: user.id, action: "archive", entityType: "emergency", entityId: id });
}
