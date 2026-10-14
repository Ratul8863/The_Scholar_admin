import { Schema } from "mongoose";
import { objectId, registerModel, researchShape } from "@/models/helpers";

const professorUniversitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    countryId: { type: objectId, ref: "Country", required: true },
    city: { type: String, default: "" },
    website: { type: String, default: "" },
    normalizedWebsite: { type: String, default: "" },
    ...researchShape,
  },
  { timestamps: true },
);
professorUniversitySchema.index({ countryId: 1, archivedAt: 1 });
professorUniversitySchema.index({ normalizedName: 1, countryId: 1 });

const departmentSchema = new Schema(
  {
    professorUniversityId: { type: objectId, ref: "ProfessorResearchUniversity", required: true, index: true },
    countryId: { type: objectId, ref: "Country", required: true },
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    officialUrl: { type: String, default: "" },
    researchAreas: { type: [String], default: [] },
    description: { type: String, default: "" },
    ...researchShape,
  },
  { timestamps: true },
);

const professorSchema = new Schema(
  {
    professorUniversityId: { type: objectId, ref: "ProfessorResearchUniversity", required: true },
    departmentId: { type: objectId, ref: "ProfessorDepartment", required: true },
    countryId: { type: objectId, ref: "Country", required: true },
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    email: { type: String, default: "" },
    normalizedEmail: { type: String, default: "" },
    designation: { type: String, default: "" },
    recentResearch: { type: String, default: "" },
    previousResearch: { type: String, default: "" },
    researchAreas: { type: [String], default: [] },
    officialProfile: { type: String, default: "" },
    normalizedProfile: { type: String, default: "" },
    labName: { type: String, default: "" },
    labUrl: { type: String, default: "" },
    googleScholarUrl: { type: String, default: "" },
    orcid: { type: String, default: "" },
    website: { type: String, default: "" },
    researchStatus: { type: String, default: "new" },
    ...researchShape,
  },
  { timestamps: true },
);
professorSchema.index({ professorUniversityId: 1, departmentId: 1, archivedAt: 1 });
professorSchema.index({ normalizedName: 1, professorUniversityId: 1 });
professorSchema.index({ normalizedEmail: 1 });
professorSchema.index({ normalizedProfile: 1 });
professorSchema.index(
  { name: "text", email: "text", researchAreas: "text", designation: "text" },
  { default_language: "none", name: "professor_text" },
);

const publicationSchema = new Schema(
  {
    professorId: { type: objectId, ref: "Professor", required: true, index: true },
    title: { type: String, required: true, trim: true },
    year: { type: Number, default: null },
    venue: { type: String, default: "" },
    url: { type: String, default: "" },
    authors: { type: String, default: "" },
    createdBy: { type: objectId, ref: "User" },
  },
  { timestamps: true },
);

export const ProfessorResearchUniversity = registerModel("ProfessorResearchUniversity", professorUniversitySchema);
export const ProfessorDepartment = registerModel("ProfessorDepartment", departmentSchema);
export const Professor = registerModel("Professor", professorSchema);
export const ProfessorPublication = registerModel("ProfessorPublication", publicationSchema);
