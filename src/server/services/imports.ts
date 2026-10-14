import "server-only";
import Papa from "papaparse";
import { ImportJob } from "@/models/platform";
import { AppError } from "@/lib/errors";
import type { CurrentUser } from "@/server/auth/current-user";
import { createScholarship, type ScholarshipInput } from "@/server/services/scholarships";
import { createUniversity } from "@/server/services/universities";
import { createProfessor } from "@/server/services/professors";
import { saveOpportunity } from "@/server/services/opportunities";
import { oid } from "@/server/services/query";
import { writeAudit } from "@/server/services/audit";

const limit = 5_000_000;

export function parseImport(text: string) {
  if (text.length > limit) throw new AppError("validation", "That file is larger than the 5 MB infrastructure limit.");
  const trimmed = text.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const json = JSON.parse(trimmed) as unknown;
    const rows = Array.isArray(json) ? json : [json];
    return rows.map((row) => (row && typeof row === "object" ? (row as Record<string, string>) : {}));
  }
  const parsed = Papa.parse<Record<string, string>>(trimmed, { header: true, skipEmptyLines: true });
  if (parsed.errors.length && parsed.data.length === 0) throw new AppError("validation", parsed.errors[0]?.message ?? "The file could not be parsed.");
  return parsed.data;
}

export async function commitImport(user: CurrentUser, entityType: string, rows: Record<string, string>[], acknowledgeDuplicate: boolean) {
  const summary = { total: rows.length, valid: 0, invalid: 0, duplicate: 0, created: 0, updated: 0, skipped: 0, failed: 0 };
  const errors: { row: number; message: string }[] = [];
  for (const [index, row] of rows.entries()) {
    try {
      if (entityType === "scholarship") {
        await createScholarship(user, { ...(row as unknown as ScholarshipInput), acknowledgeDuplicate });
      } else if (entityType === "university") {
        await createUniversity(user, { ...row, acknowledgeDuplicate });
      } else if (entityType === "professor") {
        await createProfessor(user, { ...row, acknowledgeDuplicate });
      } else if (entityType === "opportunity") {
        await saveOpportunity(user, { ...row, acknowledgeDuplicate });
      } else {
        throw new AppError("validation", "That import type is not supported.");
      }
      summary.created += 1;
      summary.valid += 1;
    } catch (error) {
      if (error instanceof AppError && error.code === "duplicate") {
        summary.duplicate += 1;
        summary.skipped += 1;
        errors.push({ row: index + 1, message: error.message });
      } else {
        summary.failed += 1;
        summary.invalid += 1;
        errors.push({ row: index + 1, message: error instanceof Error ? error.message : "Row failed." });
      }
    }
  }
  const job = await ImportJob.create({ entityType, status: "complete", createdBy: oid(user.id), summary, rowErrors: errors });
  await writeAudit({ actorUserId: user.id, action: "import", entityType, entityId: String(job._id), metadata: summary });
  return { id: String(job._id), summary, errors };
}
