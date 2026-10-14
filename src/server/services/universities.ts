import "server-only";
import { ProgramIntake, University, UniversityProgram, UniversityRanking } from "@/models";
import { AppError } from "@/lib/errors";
import { asRecord } from "@/lib/serialize";
import type { ListQuery } from "@/lib/query";
import type { CurrentUser } from "@/server/auth/current-user";
import { duplicateAssessment } from "@/server/domain/duplicates";
import { normalizeText, normalizeUrl } from "@/server/domain/text";
import { writeAudit } from "@/server/services/audit";
import { archiveDeadlines, cleanDate, cleanUrl, customValues, syncDeadline } from "@/server/services/relations";
import { archiveDoc, countryLookup, oid, paginate, ready, requireCountry, saveUpdate, searchClause, type DocModel } from "@/server/services/query";

function choice(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

const universities = University as unknown as DocModel;
const programs = UniversityProgram as unknown as DocModel;
const intakes = ProgramIntake as unknown as DocModel;

export async function listUniversities(query: ListQuery) {
  await ready();
  const filter: Record<string, unknown> = { archivedAt: null, ...searchClause(query, ["name", "city"]) };
  if (query.filters.country) filter.countryId = oid(query.filters.country);
  if (query.filters.type) filter.universityType = query.filters.type;
  const page = await paginate(universities, filter, query);
  const countries = await countryLookup(page.rows.map((row) => (row as { countryId?: unknown }).countryId));
  return {
    ...page,
    rows: page.rows.map((row) => {
      const record = asRecord(row);
      return { ...record, countryName: countries.get(String(record.countryId ?? ""))?.name ?? "Unknown country" };
    }),
  };
}

export async function universitiesForCountry(countryId: string) {
  await ready();
  const rows = await University.find({ countryId: oid(countryId), archivedAt: null }).sort({ name: 1 }).lean();
  return rows.map((row) => asRecord(row));
}

export async function getUniversity(id: string) {
  await ready();
  const doc = await University.findOne({ _id: oid(id), archivedAt: null }).lean();
  if (!doc) throw new AppError("not_found", "University was not found.");
  const [programRows, rankingRows] = await Promise.all([
    UniversityProgram.find({ universityId: doc._id, archivedAt: null }).sort({ name: 1 }).lean(),
    UniversityRanking.find({ universityId: doc._id }).sort({ year: -1 }).lean(),
  ]);
  return { ...asRecord(doc), programs: programRows.map((row) => asRecord(row)), rankings: rankingRows.map((row) => asRecord(row)) } as Record<string, unknown> & { programs: Record<string, unknown>[]; rankings: Record<string, unknown>[] };
}

export async function createUniversity(user: CurrentUser, input: Record<string, unknown>) {
  await ready();
  const name = String(input.name ?? "").trim();
  const countryId = String(input.countryId ?? "");
  if (name.length < 2) throw new AppError("validation", "Enter the university name.");
  await requireCountry(countryId);
  const website = cleanUrl(input.website);
  const duplicates = await universityDuplicates(name, countryId, website);
  if (duplicates.length && input.acknowledgeDuplicate !== true) {
    throw new AppError("duplicate", "A possible duplicate university already exists.", { matches: duplicates });
  }
  const doc = await University.create({
    name,
    normalizedName: normalizeText(name),
    countryId: oid(countryId),
    city: String(input.city ?? ""),
    region: String(input.region ?? ""),
    universityType: String(input.universityType ?? "other"),
    website,
    normalizedWebsite: website ? normalizeUrl(website) : "",
    applicationStatus: String(input.applicationStatus ?? "unknown"),
    acceptanceRate: input.acceptanceRate === "" || input.acceptanceRate == null ? null : Number(input.acceptanceRate),
    description: String(input.description ?? ""),
    fieldAvailability: input.fieldAvailability ?? {},
    customFields: await customValues("university", (input.customFields as Record<string, unknown>) ?? {}),
    createdBy: oid(user.id),
    updatedBy: oid(user.id),
  });
  await writeAudit({ actorUserId: user.id, action: "create", entityType: "university", entityId: String(doc._id) });
  return String(doc._id);
}

async function universityDuplicates(name: string, countryId: string, website: string, exceptId?: string) {
  const or: Record<string, unknown>[] = [{ normalizedName: normalizeText(name), countryId: oid(countryId) }];
  if (website) or.push({ normalizedWebsite: normalizeUrl(website) });
  const candidates = (await University.find({ archivedAt: null, $or: or }).limit(8).lean()) as unknown as Record<string, unknown>[];
  return candidates
    .filter((candidate) => String(candidate._id) !== exceptId)
    .filter((candidate) =>
      duplicateAssessment([
        { key: "name", weight: 0.5, kind: "text", strong: true, left: name, right: String(candidate.name ?? "") },
        { key: "country", weight: 0.2, kind: "exact", left: countryId, right: String(candidate.countryId ?? "") },
        { key: "website", weight: 0.3, kind: "url", strong: true, left: website, right: String(candidate.website ?? "") },
      ]).possible,
    )
    .map((candidate) => ({ id: String(candidate._id), name: String(candidate.name) }));
}

export async function updateUniversity(user: CurrentUser, id: string, input: Record<string, unknown>) {
  const current = await University.findOne({ _id: oid(id), archivedAt: null }).lean();
  if (!current) throw new AppError("not_found", "University was not found.");
  const name = String(input.name ?? current.name).trim();
  const countryId = String(input.countryId ?? current.countryId);
  const website = cleanUrl(input.website ?? current.website);
  const duplicates = await universityDuplicates(name, countryId, website, id);
  if (duplicates.length && input.acknowledgeDuplicate !== true) {
    throw new AppError("duplicate", "A possible duplicate university already exists.", { matches: duplicates });
  }
  await saveUpdate(universities, id, Number(input.version ?? current.version), {
    name,
    normalizedName: normalizeText(name),
    countryId: oid(countryId),
    city: String(input.city ?? ""),
    region: String(input.region ?? ""),
    universityType: String(input.universityType ?? "other"),
    website,
    normalizedWebsite: website ? normalizeUrl(website) : "",
    applicationStatus: String(input.applicationStatus ?? "unknown"),
    acceptanceRate: input.acceptanceRate === "" || input.acceptanceRate == null ? null : Number(input.acceptanceRate),
    description: String(input.description ?? ""),
    fieldAvailability: input.fieldAvailability ?? current.fieldAvailability ?? {},
    customFields: await customValues("university", (input.customFields as Record<string, unknown>) ?? {}),
    updatedBy: oid(user.id),
  });
  await writeAudit({ actorUserId: user.id, action: "edit", entityType: "university", entityId: id });
}

export async function archiveUniversity(user: CurrentUser, id: string) {
  await archiveDoc(universities, id, user.id);
  await archiveDeadlines("university", id);
  await writeAudit({ actorUserId: user.id, action: "archive", entityType: "university", entityId: id });
}

export async function getProgram(id: string) {
  await ready();
  const program = await UniversityProgram.findOne({ _id: oid(id), archivedAt: null }).lean();
  if (!program) throw new AppError("not_found", "Program was not found.");
  const intakeRows = await ProgramIntake.find({ programId: program._id, archivedAt: null }).sort({ year: -1 }).lean();
  return { ...asRecord(program), intakes: intakeRows.map((row) => asRecord(row)) } as Record<string, unknown> & { intakes: Record<string, unknown>[] };
}

export async function saveProgram(user: CurrentUser, input: Record<string, unknown>) {
  await ready();
  const university = await University.findOne({ _id: oid(String(input.universityId)), archivedAt: null }).lean();
  if (!university) throw new AppError("not_found", "University was not found.");
  const name = String(input.name ?? "").trim();
  if (name.length < 2) throw new AppError("validation", "Enter the program name.");
  const data = {
    universityId: university._id,
    countryId: university.countryId,
    name,
    normalizedName: normalizeText(name),
    department: String(input.department ?? ""),
    faculty: String(input.faculty ?? ""),
    degreeLevelId: input.degreeLevelId ? oid(String(input.degreeLevelId)) : null,
    fieldOfStudyId: input.fieldOfStudyId ? oid(String(input.fieldOfStudyId)) : null,
    language: String(input.language ?? ""),
    website: cleanUrl(input.website),
    applicationUrl: cleanUrl(input.applicationUrl),
    applicationStatus: choice(input.applicationStatus, "unknown"),
    tuitionFee: input.tuitionFee === "" || input.tuitionFee == null ? null : Number(input.tuitionFee),
    currency: String(input.currency ?? ""),
    tuitionPeriod: String(input.tuitionPeriod ?? ""),
    applicationFee: input.applicationFee === "" || input.applicationFee == null ? null : Number(input.applicationFee),
    applicationFeeCurrency: String(input.applicationFeeCurrency ?? ""),
    academicRequirements: String(input.academicRequirements ?? ""),
    admissionRequirements: String(input.admissionRequirements ?? ""),
    eligibility: String(input.eligibility ?? ""),
    bangladeshEligible: choice(input.bangladeshEligible, "unknown"),
    scholarshipAvailable: choice(input.scholarshipAvailable, "unknown"),
    fieldAvailability: input.fieldAvailability ?? {},
    customFields: await customValues("program", (input.customFields as Record<string, unknown>) ?? {}),
    updatedBy: oid(user.id),
  };
  if (input.id) {
    await saveUpdate(programs, String(input.id), Number(input.version), data);
    await writeAudit({ actorUserId: user.id, action: "edit", entityType: "program", entityId: String(input.id) });
    return String(input.id);
  }
  const doc = await UniversityProgram.create({ ...data, createdBy: oid(user.id) });
  await writeAudit({ actorUserId: user.id, action: "create", entityType: "program", entityId: String(doc._id) });
  return String(doc._id);
}

export async function saveIntake(user: CurrentUser, input: Record<string, unknown>) {
  await ready();
  const program = await UniversityProgram.findOne({ _id: oid(String(input.programId)), archivedAt: null }).lean();
  if (!program) throw new AppError("not_found", "Program was not found.");
  const openingDate = cleanDate(input.openingDate);
  const closingDate = cleanDate(input.closingDate);
  const data = {
    programId: program._id,
    universityId: program.universityId,
    season: String(input.season ?? "other"),
    year: input.year ? Number(input.year) : null,
    openingDate,
    closingDate,
    timezone: String(input.timezone ?? "UTC"),
    status: String(input.status ?? "unknown"),
    sourceUrl: cleanUrl(input.sourceUrl),
    verified: input.verified === true,
    updatedBy: oid(user.id),
  };
  const id = input.id
    ? (await saveUpdate(intakes, String(input.id), Number(input.version), data), String(input.id))
    : String((await ProgramIntake.create({ ...data, createdBy: oid(user.id) }))._id);
  await syncDeadline({
    entityType: "program",
    entityId: String(program._id),
    subEntityType: "intake",
    subEntityId: id,
    deadlineType: "intake",
    label: `${program.name} ${data.season} ${data.year ?? ""}`.trim(),
    openingDate,
    closingDate,
    timezone: data.timezone,
    sourceUrl: data.sourceUrl,
    countryId: String(program.countryId),
  });
  await writeAudit({ actorUserId: user.id, action: input.id ? "edit" : "create", entityType: "intake", entityId: id });
  return id;
}

export async function saveRanking(user: CurrentUser, input: Record<string, unknown>) {
  await ready();
  const universityId = oid(String(input.universityId));
  const organization = String(input.organization ?? "").trim();
  if (!organization) throw new AppError("validation", "Enter the ranking organization.");
  if (!cleanUrl(input.sourceUrl)) throw new AppError("validation", "A ranking needs its official source URL. Do not enter an unverified rank.");
  const doc = await UniversityRanking.create({
    universityId,
    organization,
    year: input.year ? Number(input.year) : null,
    overallRank: String(input.overallRank ?? ""),
    regionalRank: String(input.regionalRank ?? ""),
    subjectRank: String(input.subjectRank ?? ""),
    subject: String(input.subject ?? ""),
    sourceUrl: cleanUrl(input.sourceUrl),
    verified: input.verified === true,
    updatedBy: oid(user.id),
  });
  await writeAudit({ actorUserId: user.id, action: "create", entityType: "ranking", entityId: String(doc._id) });
  return String(doc._id);
}

export async function countryCards() {
  await ready();
  const rows = await University.aggregate([
    { $match: { archivedAt: null } },
    { $group: { _id: "$countryId", count: { $sum: 1 } } },
  ]);
  const countries = await countryLookup(rows.map((row) => row._id));
  return rows
    .map((row) => ({
      id: String(row._id),
      name: countries.get(String(row._id))?.name ?? "Unknown",
      code: countries.get(String(row._id))?.code ?? "",
      count: row.count as number,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
