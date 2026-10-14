import "server-only";
import { Scholarship } from "@/models";
import { duplicateAssessment } from "@/server/domain/duplicates";
import { normalizeText, normalizeUrl } from "@/server/domain/text";
import { AppError } from "@/lib/errors";
import type { CurrentUser } from "@/server/auth/current-user";
import type { ListQuery } from "@/lib/query";
import { diffFields, writeAudit } from "@/server/services/audit";
import { archiveDeadlines, customValues, cleanDate, cleanUrl, recordChanges, syncDeadline } from "@/server/services/relations";
import { archiveDoc, countryLookup, oid, paginate, ready, requireCountry, saveUpdate, searchClause, type DocModel } from "@/server/services/query";
import { asRecord } from "@/lib/serialize";

const model = Scholarship as unknown as DocModel;

export type ScholarshipInput = {
  id?: string;
  name: string;
  provider: string;
  countryId: string;
  degreeLevelIds?: string[];
  fundingTypeIds?: string[];
  funding?: Record<string, unknown>;
  eligibility?: Record<string, unknown>;
  documentKeys?: string[];
  application?: Record<string, unknown>;
  openingDate?: string | null;
  closingDate?: string | null;
  timezone?: string;
  researchStatus?: string;
  publicationStatus?: string;
  officialUrl?: string;
  applicationUrl?: string;
  linkedUniversityIds?: string[];
  fieldAvailability?: Record<string, string>;
  customFields?: Record<string, unknown>;
  acknowledgeDuplicate?: boolean;
  version?: number;
};

function normalized(input: ScholarshipInput) {
  return {
    name: input.name.trim(),
    normalizedName: normalizeText(input.name),
    provider: input.provider.trim(),
    normalizedProvider: normalizeText(input.provider),
    officialUrl: cleanUrl(input.officialUrl),
    normalizedOfficialUrl: input.officialUrl ? normalizeUrl(input.officialUrl) : "",
    applicationUrl: cleanUrl(input.applicationUrl || (input.application?.url as string | undefined)),
  };
}

export async function findScholarshipDuplicates(input: ScholarshipInput, exceptId?: string) {
  await ready();
  const values = normalized(input);
  const or: Record<string, unknown>[] = [{ normalizedName: values.normalizedName, countryId: oid(input.countryId) }];
  if (values.normalizedOfficialUrl) or.push({ normalizedOfficialUrl: values.normalizedOfficialUrl });
  const candidates = (await Scholarship.find({ archivedAt: null, $or: or }).limit(12).lean()) as unknown as Record<string, unknown>[];
  return candidates
    .filter((candidate) => String(candidate._id) !== exceptId)
    .map((candidate) => {
      const assessment = duplicateAssessment([
        { key: "name", weight: 0.35, kind: "text", strong: true, left: values.name, right: String(candidate.name ?? "") },
        { key: "provider", weight: 0.2, kind: "text", left: values.provider, right: String(candidate.provider ?? "") },
        { key: "country", weight: 0.1, kind: "exact", left: input.countryId, right: String(candidate.countryId ?? "") },
        { key: "url", weight: 0.35, kind: "url", strong: true, left: values.officialUrl, right: String(candidate.officialUrl ?? "") },
      ]);
      return { id: String(candidate._id), name: String(candidate.name), provider: String(candidate.provider), assessment };
    })
    .filter((candidate) => candidate.assessment.possible);
}

async function payload(input: ScholarshipInput, actorId: string, creating: boolean) {
  await requireCountry(input.countryId);
  const values = normalized(input);
  const custom = await customValues("scholarship", input.customFields);
  return {
    ...values,
    countryId: oid(input.countryId),
    degreeLevelIds: (input.degreeLevelIds ?? []).map((id) => oid(id)),
    fundingTypeIds: (input.fundingTypeIds ?? []).map((id) => oid(id)),
    funding: input.funding ?? {},
    eligibility: input.eligibility ?? {},
    documentKeys: input.documentKeys ?? [],
    application: { ...(input.application ?? {}), url: values.applicationUrl },
    openingDate: cleanDate(input.openingDate),
    closingDate: cleanDate(input.closingDate),
    timezone: input.timezone || "UTC",
    researchStatus: input.researchStatus || "new",
    publicationStatus: input.publicationStatus || "not_ready",
    linkedUniversityIds: (input.linkedUniversityIds ?? []).map((id) => oid(id)),
    fieldAvailability: input.fieldAvailability ?? {},
    customFields: custom,
    updatedBy: oid(actorId),
    ...(creating ? { createdBy: oid(actorId) } : {}),
  };
}

export async function listScholarships(query: ListQuery) {
  await ready();
  const filter: Record<string, unknown> = { archivedAt: null, ...searchClause(query, ["name", "provider"]) };
  if (query.filters.country) filter.countryId = oid(query.filters.country);
  if (query.filters.research) filter.researchStatus = query.filters.research;
  if (query.filters.publication) filter.publicationStatus = query.filters.publication;
  if (query.filters.funding) filter.fundingTypeIds = oid(query.filters.funding);
  if (query.filters.degree) filter.degreeLevelIds = oid(query.filters.degree);
  const page = await paginate(model, filter, query);
  const countries = await countryLookup(page.rows.map((row) => (row as { countryId?: unknown }).countryId));
  return {
    ...page,
    rows: page.rows.map((row) => {
      const record = asRecord(row);
      const country = countries.get(String(record.countryId ?? ""));
      return { ...record, countryName: country?.name ?? "Unknown country" } as Record<string, unknown>;
    }),
  };
}

export async function getScholarship(id: string) {
  await ready();
  const doc = await Scholarship.findOne({ _id: oid(id), archivedAt: null }).lean();
  if (!doc) throw new AppError("not_found", "Scholarship was not found.");
  return asRecord(doc);
}

export async function createScholarship(user: CurrentUser, input: ScholarshipInput) {
  const duplicates = await findScholarshipDuplicates(input);
  if (duplicates.length && !input.acknowledgeDuplicate) {
    throw new AppError("duplicate", "A possible duplicate scholarship already exists.", { matches: duplicates });
  }
  const doc = await Scholarship.create(await payload(input, user.id, true));
  await syncDeadline({
    entityType: "scholarship",
    entityId: String(doc._id),
    deadlineType: "application",
    label: input.name,
    openingDate: doc.openingDate,
    closingDate: doc.closingDate,
    timezone: doc.timezone,
    sourceUrl: doc.officialUrl,
    countryId: input.countryId,
  });
  await writeAudit({ actorUserId: user.id, action: "create", entityType: "scholarship", entityId: String(doc._id) });
  return String(doc._id);
}

export async function updateScholarship(user: CurrentUser, id: string, input: ScholarshipInput) {
  const before = await getScholarship(id);
  if (before.researchStatus === "verified" && input.researchStatus && input.researchStatus !== "verified") {
    await recordChanges(user, "scholarship", id, "request_correction", [
      { field: "researchStatus", oldValue: before.researchStatus, newValue: input.researchStatus },
    ]);
  }
  const duplicates = await findScholarshipDuplicates(input, id);
  if (duplicates.length && !input.acknowledgeDuplicate) {
    throw new AppError("duplicate", "A possible duplicate scholarship already exists.", { matches: duplicates });
  }
  const next = await payload(input, user.id, false);
  const updated = await saveUpdate(model, id, Number(input.version ?? before.version ?? 1), next);
  await syncDeadline({
    entityType: "scholarship",
    entityId: id,
    deadlineType: "application",
    label: input.name,
    openingDate: cleanDate(input.openingDate),
    closingDate: cleanDate(input.closingDate),
    timezone: input.timezone,
    sourceUrl: cleanUrl(input.officialUrl),
    countryId: input.countryId,
  });
  const after = asRecord(updated);
  await recordChanges(
    user,
    "scholarship",
    id,
    input.researchStatus === "verified" && before.researchStatus !== "verified" ? "verify" : "edit",
    diffFields(before, after, ["name", "provider", "researchStatus", "publicationStatus", "officialUrl", "openingDate", "closingDate"]),
  );
  return id;
}

export async function archiveScholarship(user: CurrentUser, id: string) {
  await archiveDoc(model, id, user.id);
  await archiveDeadlines("scholarship", id);
  await writeAudit({ actorUserId: user.id, action: "archive", entityType: "scholarship", entityId: id });
}
