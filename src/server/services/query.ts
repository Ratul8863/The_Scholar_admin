import "server-only";
import { connection } from "next/server";
import mongoose, { type Model } from "mongoose";
import { AppError } from "@/lib/errors";
import { escapeRegex } from "@/lib/utils";
import { normalizeText } from "@/server/domain/text";
import { connectDB } from "@/server/db/mongoose";
import { Country, User } from "@/models";
import type { ListQuery } from "@/lib/query";

export type DocModel = Model<mongoose.Document>;

export async function ready() {
  await connection();
  await connectDB();
}

export function oid(id: string, label = "record") {
  if (!mongoose.isValidObjectId(id)) throw new AppError("validation", `That ${label} is not valid.`);
  return new mongoose.Types.ObjectId(id);
}

export function searchClause(query: ListQuery, fields: string[]) {
  if (!query.q) return {};
  if (query.q.length >= 3) return { $text: { $search: query.q } };
  const pattern = new RegExp(escapeRegex(normalizeText(query.q)), "i");
  return { $or: fields.map((field) => ({ [field]: pattern })) };
}

export async function paginate(model: DocModel, filter: Record<string, unknown>, query: ListQuery) {
  const skip = (query.page - 1) * query.pageSize;
  const sort = { [query.sort]: query.dir === "asc" ? 1 : -1 } as Record<string, 1 | -1>;
  const [rows, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(query.pageSize).lean(),
    model.countDocuments(filter),
  ]);
  return {
    rows,
    total,
    page: query.page,
    pageSize: query.pageSize,
    pages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function countryLookup(ids: unknown[]) {
  const unique = [...new Set(ids.filter(Boolean).map((id) => String(id)))];
  if (unique.length === 0) return new Map<string, { name: string; code: string }>();
  const countries = await Country.find({ _id: { $in: unique } }).select("name code").lean();
  return new Map(countries.map((country) => [String(country._id), { name: country.name, code: country.code }]));
}

export async function userLookup(ids: unknown[]) {
  const unique = [...new Set(ids.filter(Boolean).map((id) => String(id)))];
  if (unique.length === 0) return new Map<string, { name: string; email: string }>();
  const users = await User.find({ _id: { $in: unique } }).select("name email").lean();
  return new Map(users.map((user) => [String(user._id), { name: user.name, email: user.email }]));
}

export async function requireCountry(id: string) {
  const country = await Country.findOne({ _id: oid(id, "country"), active: true }).lean();
  if (!country) throw new AppError("validation", "Choose an active country.");
  return country;
}

export function notFound(doc: unknown, label: string) {
  if (!doc) throw new AppError("not_found", `${label} was not found.`);
}

export async function saveUpdate(model: DocModel, id: string, version: number, set: Record<string, unknown>) {
  const doc = await model
    .findOneAndUpdate({ _id: oid(id), version, archivedAt: null }, { $set: set, $inc: { version: 1 } }, { new: true })
    .lean();
  if (!doc) throw new AppError("conflict", "This record was updated or archived by someone else. Reload it and try again.");
  return doc;
}

export async function archiveDoc(model: DocModel, id: string, actorId: string) {
  const doc = await model
    .findOneAndUpdate(
      { _id: oid(id), archivedAt: null },
      { $set: { archivedAt: new Date(), archivedBy: oid(actorId) }, $inc: { version: 1 } },
      { new: true },
    )
    .lean();
  if (!doc) throw new AppError("not_found", "That record is not available to archive.");
  return doc;
}
