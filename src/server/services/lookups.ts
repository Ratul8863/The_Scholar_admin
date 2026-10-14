import "server-only";
import mongoose from "mongoose";
import { Country, Professor, University } from "@/models";
import { escapeRegex } from "@/lib/utils";
import { connectDB } from "@/server/db/mongoose";

export type LookupKind = "country" | "university" | "professor";
export type LookupOption = { value: string; label: string; hint?: string };

const kinds = new Set<LookupKind>(["country", "university", "professor"]);

export function isLookupKind(value: string | null): value is LookupKind {
  return kinds.has(value as LookupKind);
}

export async function searchLookups(kind: LookupKind, q: string, id?: string): Promise<LookupOption[]> {
  await connectDB();
  const query = q.trim().slice(0, 80);
  const pattern = query ? new RegExp(escapeRegex(query), "i") : null;
  if (id && !mongoose.isValidObjectId(id)) return [];

  if (kind === "country") {
    if (id) {
      const row = await Country.findById(id).select("name code").lean();
      return row ? [{ value: String(row._id), label: row.name, hint: row.code }] : [];
    }
    const filter: Record<string, unknown> = { active: { $ne: false } };
    if (pattern) filter.name = pattern;
    const rows = await Country.find(filter).sort({ name: 1 }).limit(20).select("name code").lean();
    return rows.map((row) => ({ value: String(row._id), label: row.name, hint: row.code }));
  }

  if (kind === "university") {
    if (id) {
      const row = await University.findOne({ _id: id, archivedAt: null }).select("name city").lean();
      return row ? [{ value: String(row._id), label: row.name, hint: row.city || undefined }] : [];
    }
    const filter: Record<string, unknown> = { archivedAt: null };
    if (pattern) filter.name = pattern;
    const rows = await University.find(filter).sort({ name: 1 }).limit(20).select("name city").lean();
    return rows.map((row) => ({ value: String(row._id), label: row.name, hint: row.city || undefined }));
  }

  if (id) {
    const row = await Professor.findOne({ _id: id, archivedAt: null }).select("name designation").lean();
    return row ? [{ value: String(row._id), label: row.name, hint: row.designation || undefined }] : [];
  }
  const filter: Record<string, unknown> = { archivedAt: null };
  if (pattern) filter.name = pattern;
  const rows = await Professor.find(filter).sort({ name: 1 }).limit(20).select("name designation").lean();
  return rows.map((row) => ({ value: String(row._id), label: row.name, hint: row.designation || undefined }));
}
