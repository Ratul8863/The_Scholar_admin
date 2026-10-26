import { Schema } from "mongoose";
import { objectId, registerModel, researchShape } from "@/models/helpers";

const tri = { type: String, enum: ["yes", "no", "unknown"], default: "unknown" };

const scholarshipSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    provider: { type: String, required: true, trim: true },
    normalizedProvider: { type: String, required: true },
    countryId: { type: objectId, ref: "Country", default: null },
    degreeLevelIds: [{ type: objectId, ref: "DegreeLevel" }],
    fundingTypeIds: [{ type: objectId, ref: "FundingType" }],
    funding: {
      tuitionCoverage: { type: String, default: "" },
      tuitionPercentage: { type: Number, default: null },
      monthlyStipend: { type: Number, default: null },
      annualStipend: { type: Number, default: null },
      accommodation: { type: String, default: "" },
      airfare: { type: String, default: "" },
      insurance: { type: String, default: "" },
      visaSupport: { type: String, default: "" },
      researchGrant: { type: String, default: "" },
      mealAllowance: { type: String, default: "" },
      duration: { type: String, default: "" },
      notes: { type: String, default: "" },
      currency: { type: String, default: "" },
    },
    eligibility: {
      nationality: { type: String, default: "" },
      bangladeshEligible: tri,
      internationalStudentsEligible: tri,
      minimumGpa: { type: String, default: "" },
      ielts: { type: String, default: "" },
      toefl: { type: String, default: "" },
      sat: { type: String, default: "" },
      gre: { type: String, default: "" },
      gmat: { type: String, default: "" },
      topik: { type: String, default: "" },
      ageRequirement: { type: String, default: "" },
      academicBackground: { type: String, default: "" },
      workExperience: { type: String, default: "" },
      financialNeed: { type: String, default: "" },
      other: { type: String, default: "" },
      summary: { type: String, default: "" },
    },
    documentKeys: { type: [String], default: [] },
    application: {
      method: { type: String, default: "" },
      portal: { type: String, default: "" },
      url: { type: String, default: "" },
      fee: { type: Number, default: null },
      currency: { type: String, default: "" },
      feeWaiver: tri,
      separateUniversityApplication: tri,
      separateScholarshipApplication: tri,
      nominationRequired: tri,
      professorContactRequired: tri,
      professorAcceptanceRequired: tri,
      recommendationRequired: tri,
      steps: { type: String, default: "" },
      notes: { type: String, default: "" },
    },
    openingDate: { type: Date, default: null },
    closingDate: { type: Date, default: null },
    timezone: { type: String, default: "UTC" },
    researchStatus: { type: String, default: "new", index: true },
    publicationStatus: { type: String, default: "not_ready", index: true },
    officialUrl: { type: String, default: "" },
    normalizedOfficialUrl: { type: String, default: "" },
    applicationUrl: { type: String, default: "" },
    linkedUniversityIds: [{ type: objectId, ref: "University" }],
    ...researchShape,
  },
  { timestamps: true },
);
scholarshipSchema.index({ countryId: 1, researchStatus: 1, archivedAt: 1 });
scholarshipSchema.index({ archivedAt: 1, updatedAt: -1 });
scholarshipSchema.index({ archivedAt: 1, name: 1 });
scholarshipSchema.index({ normalizedName: 1, countryId: 1 });
scholarshipSchema.index({ normalizedOfficialUrl: 1 });
scholarshipSchema.index({ openingDate: 1 });
scholarshipSchema.index({ closingDate: 1 });
scholarshipSchema.index(
  { name: "text", provider: "text" },
  { default_language: "none", weights: { name: 10, provider: 4 }, name: "scholarship_text" },
);

const universitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    countryId: { type: objectId, ref: "Country", required: true },
    city: { type: String, default: "" },
    region: { type: String, default: "" },
    universityType: { type: String, default: "other" },
    website: { type: String, default: "" },
    normalizedWebsite: { type: String, default: "" },
    applicationStatus: { type: String, default: "unknown" },
    acceptanceRate: { type: Number, default: null },
    description: { type: String, default: "" },
    ...researchShape,
  },
  { timestamps: true },
);
universitySchema.index({ countryId: 1, archivedAt: 1, name: 1 });
universitySchema.index({ archivedAt: 1, updatedAt: -1 });
universitySchema.index({ archivedAt: 1, countryId: 1 });
universitySchema.index({ normalizedName: 1, countryId: 1 });
universitySchema.index({ normalizedWebsite: 1 });
universitySchema.index({ name: "text", city: "text" }, { default_language: "none", name: "university_text" });

const programSchema = new Schema(
  {
    universityId: { type: objectId, ref: "University", required: true, index: true },
    countryId: { type: objectId, ref: "Country", required: true },
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    department: { type: String, default: "" },
    faculty: { type: String, default: "" },
    degreeLevelId: { type: objectId, ref: "DegreeLevel", default: null },
    fieldOfStudyId: { type: objectId, ref: "FieldOfStudy", default: null },
    language: { type: String, default: "" },
    website: { type: String, default: "" },
    applicationUrl: { type: String, default: "" },
    applicationStatus: { type: String, default: "unknown" },
    tuitionFee: { type: Number, default: null },
    currency: { type: String, default: "" },
    tuitionPeriod: { type: String, default: "" },
    applicationFee: { type: Number, default: null },
    applicationFeeCurrency: { type: String, default: "" },
    academicRequirements: { type: String, default: "" },
    admissionRequirements: { type: String, default: "" },
    eligibility: { type: String, default: "" },
    bangladeshEligible: tri,
    scholarshipAvailable: tri,
    ...researchShape,
  },
  { timestamps: true },
);
programSchema.index({ universityId: 1, archivedAt: 1, name: 1 });

const intakeSchema = new Schema(
  {
    programId: { type: objectId, ref: "UniversityProgram", required: true, index: true },
    universityId: { type: objectId, ref: "University", required: true, index: true },
    season: { type: String, required: true },
    year: { type: Number, default: null },
    openingDate: { type: Date, default: null },
    closingDate: { type: Date, default: null },
    timezone: { type: String, default: "UTC" },
    status: { type: String, default: "unknown" },
    sourceUrl: { type: String, default: "" },
    verified: { type: Boolean, default: false },
    ...researchShape,
  },
  { timestamps: true },
);
intakeSchema.index({ closingDate: 1 });
intakeSchema.index({ openingDate: 1 });

const rankingSchema = new Schema(
  {
    universityId: { type: objectId, ref: "University", required: true, index: true },
    organization: { type: String, required: true, trim: true },
    year: { type: Number, default: null },
    overallRank: { type: String, default: "" },
    regionalRank: { type: String, default: "" },
    subjectRank: { type: String, default: "" },
    subject: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    verified: { type: Boolean, default: false },
    updatedBy: { type: objectId, ref: "User" },
  },
  { timestamps: true },
);
rankingSchema.index({ universityId: 1, year: -1 });

export const Scholarship = registerModel("Scholarship", scholarshipSchema);
export const University = registerModel("University", universitySchema);
export const UniversityProgram = registerModel("UniversityProgram", programSchema);
export const ProgramIntake = registerModel("ProgramIntake", intakeSchema);
export const UniversityRanking = registerModel("UniversityRanking", rankingSchema);
