import "server-only";
import { Professor, ProfessorDepartment, ProfessorPublication, ProfessorResearchUniversity } from "@/models";
import { AppError } from "@/lib/errors";
import { asRecord } from "@/lib/serialize";
import type { ListQuery } from "@/lib/query";
import type { CurrentUser } from "@/server/auth/current-user";
import { duplicateAssessment } from "@/server/domain/duplicates";
import { normalizeText, normalizeUrl } from "@/server/domain/text";
import { writeAudit } from "@/server/services/audit";
import { cleanUrl, customValues } from "@/server/services/relations";
import { bumpCountryCount, syncCountryCountsIfNeeded } from "@/server/services/country-counts";
import { listCountries } from "@/server/services/settings";
import { archiveDoc, archiveMany, oid, paginate, ready, requireCountry, saveUpdate, searchClause, type DocModel } from "@/server/services/query";

const researchUniversities = ProfessorResearchUniversity as unknown as DocModel;
const departments = ProfessorDepartment as unknown as DocModel;
const professors = Professor as unknown as DocModel;

export async function professorCountryCards() {
  await syncCountryCountsIfNeeded();
  const countries = await listCountries();
  return countries
    .filter((country) => country.active !== false)
    .map((country) => ({
      id: String(country.id),
      name: String(country.name),
      code: String(country.code ?? ""),
      count: Number(country.professorUniversityCount ?? 0),
    }));
}

export async function listProfessorUniversities(countryId: string, query: ListQuery) {
  await ready();
  const filter: Record<string, unknown> = { countryId: oid(countryId), archivedAt: null, ...searchClause(query, ["name", "city"]) };
  const page = await paginate(researchUniversities, filter, { ...query, sort: query.sort === "updatedAt" ? "name" : query.sort }, "name city website updatedAt");
  return { ...page, rows: page.rows.map((row) => asRecord(row)) };
}

export async function createProfessorUniversity(user: CurrentUser, input: Record<string, unknown>) {
  await ready();
  const name = String(input.name ?? "").trim();
  const countryId = String(input.countryId ?? "");
  if (name.length < 2) throw new AppError("validation", "Enter the professor-research university name.");
  await requireCountry(countryId);
  const website = cleanUrl(input.website);
  const doc = await ProfessorResearchUniversity.create({
    name,
    normalizedName: normalizeText(name),
    countryId: oid(countryId),
    city: String(input.city ?? ""),
    website,
    normalizedWebsite: website ? normalizeUrl(website) : "",
    fieldAvailability: input.fieldAvailability ?? {},
    customFields: await customValues("professorResearchUniversity", (input.customFields as Record<string, unknown>) ?? {}),
    createdBy: oid(user.id),
    updatedBy: oid(user.id),
  });
  await bumpCountryCount(countryId, "professorUniversityCount", 1);
  await writeAudit({ actorUserId: user.id, action: "create", entityType: "professorResearchUniversity", entityId: String(doc._id) });
  return String(doc._id);
}

export async function getProfessorUniversity(id: string) {
  await ready();
  const university = await ProfessorResearchUniversity.findOne({ _id: oid(id), archivedAt: null }).lean();
  if (!university) throw new AppError("not_found", "Professor research university was not found.");
  const rows = await ProfessorDepartment.find({ professorUniversityId: university._id, archivedAt: null }).sort({ name: 1 }).select("name officialUrl").limit(80).lean();
  return { ...asRecord(university), departments: rows.map((row) => asRecord(row)) } as Record<string, unknown> & { departments: Record<string, unknown>[] };
}

export async function createDepartment(user: CurrentUser, input: Record<string, unknown>) {
  await ready();
  const university = await ProfessorResearchUniversity.findOne({ _id: oid(String(input.professorUniversityId)), archivedAt: null }).lean();
  if (!university) throw new AppError("not_found", "Professor research university was not found.");
  const name = String(input.name ?? "").trim();
  if (name.length < 2) throw new AppError("validation", "Enter the department name.");
  const doc = await ProfessorDepartment.create({
    professorUniversityId: university._id,
    countryId: university.countryId,
    name,
    normalizedName: normalizeText(name),
    officialUrl: cleanUrl(input.officialUrl),
    researchAreas: String(input.researchAreas ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    description: String(input.description ?? ""),
    customFields: await customValues("professorDepartment", (input.customFields as Record<string, unknown>) ?? {}),
    createdBy: oid(user.id),
    updatedBy: oid(user.id),
  });
  await writeAudit({ actorUserId: user.id, action: "create", entityType: "professorDepartment", entityId: String(doc._id) });
  return String(doc._id);
}

export async function getDepartment(id: string) {
  await ready();
  const department = await ProfessorDepartment.findOne({ _id: oid(id), archivedAt: null }).lean();
  if (!department) throw new AppError("not_found", "Department was not found.");
  return asRecord(department);
}

function professorPayload(input: Record<string, unknown>, actorId: string) {
  const name = String(input.name ?? "").trim();
  if (name.length < 2) throw new AppError("validation", "Enter the professor name.");
  const email = String(input.email ?? "").trim().toLowerCase();
  return {
    name,
    normalizedName: normalizeText(name),
    email,
    normalizedEmail: email,
    designation: String(input.designation ?? ""),
    recentResearch: String(input.recentResearch ?? ""),
    previousResearch: String(input.previousResearch ?? ""),
    researchAreas: Array.isArray(input.researchAreas)
      ? input.researchAreas.map(String)
      : String(input.researchAreas ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    officialProfile: cleanUrl(input.officialProfile),
    normalizedProfile: input.officialProfile ? normalizeUrl(String(input.officialProfile)) : "",
    labName: String(input.labName ?? ""),
    labUrl: cleanUrl(input.labUrl),
    googleScholarUrl: cleanUrl(input.googleScholarUrl),
    orcid: String(input.orcid ?? ""),
    website: cleanUrl(input.website),
    researchStatus: String(input.researchStatus ?? "new"),
    fieldAvailability: input.fieldAvailability ?? {},
    updatedBy: oid(actorId),
  };
}

export async function professorDuplicates(input: Record<string, unknown>, exceptId?: string) {
  await ready();
  const name = normalizeText(String(input.name ?? ""));
  const email = String(input.email ?? "").trim().toLowerCase();
  const or: Record<string, unknown>[] = [];
  if (name && input.professorUniversityId) or.push({ normalizedName: name, professorUniversityId: oid(String(input.professorUniversityId)) });
  if (email) or.push({ normalizedEmail: email });
  if (!or.length) return [];
  const candidates = (await Professor.find({ archivedAt: null, $or: or }).limit(8).lean()) as unknown as Record<string, unknown>[];
  return candidates
    .filter((candidate) => String(candidate._id) !== exceptId)
    .filter((candidate) =>
      duplicateAssessment([
        { key: "name", weight: 0.35, kind: "text", strong: true, left: String(input.name ?? ""), right: String(candidate.name ?? "") },
        { key: "university", weight: 0.2, kind: "exact", left: String(input.professorUniversityId ?? ""), right: String(candidate.professorUniversityId ?? "") },
        { key: "department", weight: 0.15, kind: "exact", left: String(input.departmentId ?? ""), right: String(candidate.departmentId ?? "") },
        { key: "email", weight: 0.2, kind: "exact", strong: true, left: email, right: String(candidate.email ?? "") },
        { key: "profile", weight: 0.1, kind: "url", strong: true, left: String(input.officialProfile ?? ""), right: String(candidate.officialProfile ?? "") },
      ]).possible,
    )
    .map((candidate) => ({ id: String(candidate._id), name: String(candidate.name), email: String(candidate.email ?? "") }));
}

export async function createProfessor(user: CurrentUser, input: Record<string, unknown>) {
  const department = await ProfessorDepartment.findOne({ _id: oid(String(input.departmentId)), archivedAt: null }).select("_id professorUniversityId countryId").lean();
  if (!department) throw new AppError("not_found", "Department was not found.");
  const duplicates = await professorDuplicates({ ...input, professorUniversityId: String(department.professorUniversityId) });
  if (duplicates.length && input.acknowledgeDuplicate !== true) {
    throw new AppError("duplicate", "A possible duplicate professor already exists.", { matches: duplicates });
  }
  const doc = await Professor.create({
    ...professorPayload(input, user.id),
    professorUniversityId: department.professorUniversityId,
    departmentId: department._id,
    countryId: department.countryId,
    customFields: await customValues("professor", (input.customFields as Record<string, unknown>) ?? {}),
    createdBy: oid(user.id),
  });
  await writeAudit({ actorUserId: user.id, action: "create", entityType: "professor", entityId: String(doc._id) });
  return String(doc._id);
}

export async function updateProfessor(user: CurrentUser, id: string, input: Record<string, unknown>) {
  const current = await Professor.findOne({ _id: oid(id), archivedAt: null }).lean();
  if (!current) throw new AppError("not_found", "Professor was not found.");
  if (current.researchStatus === "verified" && input.researchStatus && input.researchStatus !== "verified" && input.inline === true) {
    throw new AppError("conflict", "Verified professor records cannot be changed with inline edit.");
  }
  await saveUpdate(professors, id, Number(input.version ?? current.version), {
    ...professorPayload({ ...asRecord(current), ...input }, user.id),
    customFields: await customValues("professor", (input.customFields as Record<string, unknown>) ?? (current.customFields as Record<string, unknown>) ?? {}),
  });
  await writeAudit({
    actorUserId: user.id,
    action: input.researchStatus === "verified" ? "verify" : "edit",
    entityType: "professor",
    entityId: id,
  });
}

export async function listProfessors(query: ListQuery) {
  await ready();
  const filter: Record<string, unknown> = { archivedAt: null, ...searchClause(query, ["name", "email", "designation"]) };
  if (query.filters.country) filter.countryId = oid(query.filters.country);
  if (query.filters.university) filter.professorUniversityId = oid(query.filters.university);
  if (query.filters.department) filter.departmentId = oid(query.filters.department);
  if (query.filters.research) filter.researchStatus = query.filters.research;
  const page = await paginate(professors, filter, query, "name designation email researchAreas version");
  return { ...page, rows: page.rows.map((row) => asRecord(row)) };
}

export async function getProfessor(id: string) {
  await ready();
  const professor = await Professor.findOne({ _id: oid(id), archivedAt: null }).lean();
  if (!professor) throw new AppError("not_found", "Professor was not found.");
  const publications = await ProfessorPublication.find({ professorId: professor._id }).sort({ year: -1 }).select("title year venue url authors").limit(40).lean();
  return { ...asRecord(professor), publications: publications.map((row) => asRecord(row)) } as Record<string, unknown> & { publications: Record<string, unknown>[] };
}

export async function addPublication(user: CurrentUser, input: Record<string, unknown>) {
  await ready();
  const title = String(input.title ?? "").trim();
  if (!title) throw new AppError("validation", "Enter the publication title.");
  const doc = await ProfessorPublication.create({
    professorId: oid(String(input.professorId)),
    title,
    year: input.year ? Number(input.year) : null,
    venue: String(input.venue ?? ""),
    url: cleanUrl(input.url),
    authors: String(input.authors ?? ""),
    createdBy: oid(user.id),
  });
  await writeAudit({ actorUserId: user.id, action: "edit", entityType: "professor", entityId: String(input.professorId) });
  return String(doc._id);
}

export async function archiveProfessor(user: CurrentUser, id: string) {
  await archiveDoc(professors, id, user.id);
  await writeAudit({ actorUserId: user.id, action: "archive", entityType: "professor", entityId: id });
}

export async function bulkProfessorAction(user: CurrentUser, ids: string[], action: "archive") {
  if (action !== "archive") throw new AppError("validation", "That bulk action is not available.");
  const count = await archiveMany(professors, ids, user.id);
  if (count) await writeAudit({ actorUserId: user.id, action: "archive", entityType: "professor", entityId: ids.join(","), metadata: { count } });
}

export { researchUniversities, departments };
