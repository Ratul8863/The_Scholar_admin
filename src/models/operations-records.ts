import { Schema } from "mongoose";
import { objectId, registerModel, researchShape } from "@/models/helpers";

const opportunitySchema = new Schema(
  {
    type: { type: String, enum: ["leadership", "fellowship", "internship"], required: true, index: true },
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    organization: { type: String, required: true, trim: true },
    normalizedOrganization: { type: String, required: true },
    countryId: { type: objectId, ref: "Country", default: null },
    city: { type: String, default: "" },
    openingDate: { type: Date, default: null },
    closingDate: { type: Date, default: null },
    timezone: { type: String, default: "UTC" },
    eligibility: { type: String, default: "" },
    requirements: { type: String, default: "" },
    funding: { type: String, default: "" },
    fellowship: {
      duration: { type: String, default: "" },
      fundingAmount: { type: String, default: "" },
      tuitionCoverage: { type: String, default: "" },
      stipend: { type: String, default: "" },
      travel: { type: String, default: "" },
      accommodation: { type: String, default: "" },
    },
    officialUrl: { type: String, default: "" },
    normalizedOfficialUrl: { type: String, default: "" },
    applicationUrl: { type: String, default: "" },
    researchStatus: { type: String, default: "new" },
    publicationStatus: { type: String, default: "not_ready" },
    ...researchShape,
  },
  { timestamps: true },
);
opportunitySchema.index({ type: 1, countryId: 1, archivedAt: 1 });
opportunitySchema.index({ type: 1, archivedAt: 1, updatedAt: -1 });
opportunitySchema.index({ archivedAt: 1, updatedAt: -1 });
opportunitySchema.index({ normalizedName: 1, normalizedOrganization: 1 });
opportunitySchema.index({ closingDate: 1 });
opportunitySchema.index({ openingDate: 1 });
opportunitySchema.index({ name: "text", organization: "text" }, { default_language: "none", name: "opportunity_text" });

const emergencySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    informationType: { type: String, required: true, trim: true },
    countryId: { type: objectId, ref: "Country", default: null },
    relatedScholarshipId: { type: objectId, ref: "Scholarship", default: null },
    relatedUniversityId: { type: objectId, ref: "University", default: null },
    relatedOpportunityId: { type: objectId, ref: "Opportunity", default: null },
    sourceUrl: { type: String, default: "" },
    sourceName: { type: String, default: "" },
    information: { type: String, default: "" },
    uploadDate: { type: Date, default: () => new Date() },
    urgency: { type: String, enum: ["normal", "high", "emergency"], default: "normal", index: true },
    verificationStatus: { type: String, default: "not_checked" },
    contentStatus: { type: String, default: "new" },
    ...researchShape,
  },
  { timestamps: true },
);
emergencySchema.index({ urgency: 1, createdAt: -1 });
emergencySchema.index({ archivedAt: 1, createdAt: -1 });
emergencySchema.index({ title: "text", information: "text", informationType: "text" }, { default_language: "none", name: "emergency_text" });

const contentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    contentType: { type: String, required: true },
    relatedEntityType: { type: String, required: true },
    relatedEntityId: { type: objectId, required: true },
    countryId: { type: objectId, ref: "Country", default: null },
    contentStatus: { type: String, default: "idea", index: true },
    assignedResearcherId: { type: objectId, ref: "User", default: null },
    designerId: { type: objectId, ref: "User", default: null },
    editorId: { type: objectId, ref: "User", default: null },
    publisherId: { type: objectId, ref: "User", default: null },
    plannedDate: { type: Date, default: null },
    readyDate: { type: Date, default: null },
    publishedDate: { type: Date, default: null },
    publicUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    ...researchShape,
  },
  { timestamps: true },
);
contentSchema.index({ contentStatus: 1, updatedAt: -1 });
contentSchema.index({ archivedAt: 1, contentStatus: 1, updatedAt: -1 });
contentSchema.index({ relatedEntityType: 1, relatedEntityId: 1 });
contentSchema.index({ countryId: 1, contentStatus: 1 });
contentSchema.index({ title: "text" }, { default_language: "none", name: "content_text" });

export const Opportunity = registerModel("Opportunity", opportunitySchema);
export const EmergencyUpdate = registerModel("EmergencyUpdate", emergencySchema);
export const Content = registerModel("Content", contentSchema);
