import mongoose, { Schema, type Model } from "mongoose";

export function registerModel<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}

export const objectId = Schema.Types.ObjectId;

export const researchShape = {
  fieldAvailability: { type: Schema.Types.Mixed, default: {} },
  customFields: { type: Schema.Types.Mixed, default: {} },
  version: { type: Number, default: 1 },
  archivedAt: { type: Date, default: null, index: true },
  archivedBy: { type: objectId, ref: "User", default: null },
  createdBy: { type: objectId, ref: "User" },
  updatedBy: { type: objectId, ref: "User" },
};

export function activeFilter(extra: Record<string, unknown> = {}) {
  return { archivedAt: null, ...extra };
}
