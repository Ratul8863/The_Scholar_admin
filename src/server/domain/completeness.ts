import { readPath } from "@/server/domain/text";

export type FieldAvailability = "known" | "unknown" | "not_public" | "not_verified";

export function isFilled(value: unknown, availability?: FieldAvailability) {
  if (availability === "unknown" || availability === "not_public") return true;
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return true;
}

export function completeness(
  record: Record<string, unknown>,
  required: string[],
  availability: Record<string, FieldAvailability | undefined> = {},
) {
  const missing = required.filter((key) => !isFilled(readPath(record, key), availability[key]));
  const percent = required.length === 0 ? 100 : Math.round(((required.length - missing.length) / required.length) * 100);
  return { percent, missing };
}

export const REQUIRED_FIELDS = {
  scholarship: ["name", "provider", "countryId", "officialUrl"],
  university: ["name", "countryId", "website"],
  program: ["name", "universityId", "degreeLevelId"],
  professorResearchUniversity: ["name", "countryId"],
  professorDepartment: ["name", "professorUniversityId"],
  professor: ["name", "professorUniversityId", "departmentId"],
  opportunity: ["name", "organization", "countryId", "officialUrl"],
  emergency: ["title", "informationType", "information", "sourceUrl"],
  content: ["title", "contentType", "relatedEntityType", "relatedEntityId"],
} as const;
