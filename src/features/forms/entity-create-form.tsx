"use client";

import { RecordForm } from "@/components/forms/record-form";
import { saveEmergencyAction, saveOpportunityAction, saveUniversityAction, saveContentAction, saveProfessorUniversityAction, saveDepartmentAction, saveProfessorAction, saveProgramAction } from "@/server/actions/mutations";

export function EntityCreateForm({
  kind,
  countries,
  defaults,
}: {
  kind: "university" | "opportunity" | "emergency" | "content" | "professor-university" | "department" | "professor" | "program";
  countries?: { value: string; label: string }[];
  defaults?: Record<string, string>;
}) {
  const countryField = { section: "Record", name: "countryId", label: "Country", type: "select" as const, lookup: "country" as const, options: countries ?? [], required: true };
  const fields = {
    university: [ { section: "Record", name: "name", label: "University name", required: true }, countryField, { section: "Record", name: "city", label: "City" }, { section: "Record", name: "region", label: "State / region" }, { section: "Record", name: "universityType", label: "Type", type: "select" as const, options: ["public", "private", "national", "research", "technical", "applied_sciences", "other"].map((value) => ({ value, label: value })) }, { section: "Record", name: "website", label: "Official website", type: "url" as const }, { section: "Record", name: "acceptanceRate", label: "Acceptance rate", type: "number" as const }, { section: "Record", name: "description", label: "Description", type: "textarea" as const } ],
    opportunity: [ { section: "Record", name: "name", label: "Name", required: true }, { section: "Record", name: "organization", label: "Organization", required: true }, countryField, { section: "Record", name: "city", label: "City" }, { section: "Dates", name: "openingDate", label: "Opening", type: "date" as const }, { section: "Dates", name: "closingDate", label: "Closing", type: "date" as const }, { section: "Details", name: "eligibility", label: "Eligibility", type: "textarea" as const }, { section: "Details", name: "requirements", label: "Requirements", type: "textarea" as const }, { section: "Details", name: "funding", label: "Funding" }, { section: "Details", name: "duration", label: "Duration" }, { section: "Details", name: "fundingAmount", label: "Funding amount" }, { section: "Details", name: "stipend", label: "Stipend" }, { section: "Details", name: "travel", label: "Travel" }, { section: "Details", name: "accommodation", label: "Accommodation" }, { section: "Links", name: "officialUrl", label: "Official link", type: "url" as const }, { section: "Links", name: "applicationUrl", label: "Application link", type: "url" as const } ],
    emergency: [ { section: "Emergency", name: "title", label: "Title", required: true }, { section: "Emergency", name: "informationType", label: "Information type", required: true }, countryField, { section: "Emergency", name: "urgency", label: "Urgency", type: "select" as const, options: ["normal", "high", "emergency"].map((value) => ({ value, label: value })) }, { section: "Emergency", name: "sourceName", label: "Source name" }, { section: "Emergency", name: "sourceUrl", label: "Source URL", type: "url" as const }, { section: "Emergency", name: "information", label: "Information", type: "textarea" as const, required: true } ],
    content: [ { section: "Content", name: "title", label: "Title", required: true }, { section: "Content", name: "contentType", label: "Type" }, { section: "Content", name: "relatedEntityType", label: "Related type", required: true }, { section: "Content", name: "relatedEntityId", label: "Related record id", required: true }, { section: "Content", name: "plannedDate", label: "Planned date", type: "date" as const }, { section: "Content", name: "notes", label: "Notes", type: "textarea" as const } ],
    "professor-university": [ { section: "Professor research", name: "name", label: "University name", required: true }, countryField, { section: "Professor research", name: "city", label: "City" }, { section: "Professor research", name: "website", label: "Official link", type: "url" as const } ],
    department: [ { section: "Department", name: "name", label: "Department name", required: true }, { section: "Department", name: "officialUrl", label: "Official link", type: "url" as const }, { section: "Department", name: "researchAreas", label: "Research areas" }, { section: "Department", name: "description", label: "Description", type: "textarea" as const } ],
    professor: [ { section: "Professor", name: "name", label: "Name", required: true }, { section: "Professor", name: "email", label: "Professional email" }, { section: "Professor", name: "designation", label: "Designation" }, { section: "Professor", name: "researchAreas", label: "Research areas" }, { section: "Professor", name: "recentResearch", label: "Recent research", type: "textarea" as const }, { section: "Professor", name: "previousResearch", label: "Previous research", type: "textarea" as const }, { section: "Professor", name: "officialProfile", label: "Official profile", type: "url" as const }, { section: "Professor", name: "labName", label: "Lab" }, { section: "Professor", name: "labUrl", label: "Lab URL", type: "url" as const }, { section: "Professor", name: "googleScholarUrl", label: "Google Scholar", type: "url" as const }, { section: "Professor", name: "orcid", label: "ORCID" }, { section: "Professor", name: "website", label: "Website", type: "url" as const } ],
    program: [ { section: "Program", name: "name", label: "Program name", required: true }, { section: "Program", name: "department", label: "Department" }, { section: "Program", name: "faculty", label: "Faculty" }, { section: "Program", name: "language", label: "Language" }, { section: "Program", name: "tuitionFee", label: "Tuition", type: "number" as const }, { section: "Program", name: "currency", label: "Currency" }, { section: "Program", name: "applicationFee", label: "Application fee", type: "number" as const }, { section: "Program", name: "eligibility", label: "Eligibility", type: "textarea" as const }, { section: "Program", name: "academicRequirements", label: "Academic requirements", type: "textarea" as const }, { section: "Program", name: "bangladeshEligible", label: "Bangladesh eligible", type: "select" as const, options: ["unknown", "yes", "no"].map((value) => ({ value, label: value })) }, { section: "Program", name: "scholarshipAvailable", label: "Scholarship available", type: "select" as const, options: ["unknown", "yes", "no"].map((value) => ({ value, label: value })) } ],
  }[kind];

  return (
    <RecordForm
      fields={fields}
      defaults={defaults}
      onSave={async (values) => {
        const payload = { ...defaults, ...values };
        const result = kind === "university" ? await saveUniversityAction(payload)
          : kind === "opportunity" ? await saveOpportunityAction(payload)
          : kind === "emergency" ? await saveEmergencyAction(payload)
          : kind === "content" ? await saveContentAction(payload)
          : kind === "professor-university" ? await saveProfessorUniversityAction(payload)
          : kind === "department" ? await saveDepartmentAction(payload)
          : kind === "professor" ? await saveProfessorAction(payload)
          : await saveProgramAction(payload);
        return result.ok ? { ok: true, data: { id: result.data.id } } : result;
      }}
    />
  );
}
