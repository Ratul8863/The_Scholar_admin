import { Schema } from "mongoose";
import { objectId, registerModel } from "@/models/helpers";

const countrySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    flag: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0 },
    createdBy: { type: objectId, ref: "User" },
  },
  { timestamps: true },
);
countrySchema.index({ active: 1, displayOrder: 1, name: 1 });
countrySchema.index({ name: 1 });

const namedSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    scope: { type: String, default: "global" },
  },
  { timestamps: true },
);

const statusSchema = new Schema(
  {
    scope: { type: String, required: true },
    key: { type: String, required: true },
    label: { type: String, required: true },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);
statusSchema.index({ scope: 1, key: 1 }, { unique: true });

export const Country = registerModel("Country", countrySchema);
export const DegreeLevel = registerModel("DegreeLevel", namedSchema.clone());
export const FundingType = registerModel("FundingType", namedSchema.clone());
export const FieldOfStudy = registerModel("FieldOfStudy", namedSchema.clone());
export const ResearchArea = registerModel("ResearchArea", namedSchema.clone());
export const DocumentType = registerModel("DocumentType", namedSchema.clone());
export const StatusConfiguration = registerModel("StatusConfiguration", statusSchema);

const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    deadlineWarningDays: { type: Number, default: 14 },
    openingSoonDays: { type: Number, default: 30 },
    newInformationDays: { type: Number, default: 14 },
    publicationRequirements: { type: [String], default: ["verified source", "title", "explicit publish action"] },
  },
  { timestamps: true },
);

export const SystemSettings = registerModel("SystemSettings", settingsSchema);
