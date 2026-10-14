"use client";

import { RecordForm } from "@/components/forms/record-form";
import { saveScholarshipAction } from "@/server/actions/mutations";

export function ScholarshipForm({ countries }: { countries: { value: string; label: string }[] }) {
  return (
    <RecordForm
      submitLabel="Save scholarship"
      onSave={async (values) => {
        const result = await saveScholarshipAction({
          name: String(values.name ?? ""),
          provider: String(values.provider ?? ""),
          countryId: String(values.countryId ?? ""),
          officialUrl: String(values.officialUrl ?? ""),
          applicationUrl: String(values.applicationUrl ?? ""),
          openingDate: String(values.openingDate ?? ""),
          closingDate: String(values.closingDate ?? ""),
          timezone: String(values.timezone ?? "UTC"),
          researchStatus: String(values.researchStatus ?? "new"),
          publicationStatus: String(values.publicationStatus ?? "not_ready"),
          eligibility: {
            nationality: values.nationality,
            bangladeshEligible: values.bangladeshEligible || "unknown",
            internationalStudentsEligible: values.internationalEligible || "unknown",
            minimumGpa: values.minimumGpa,
            ielts: values.ielts,
            toefl: values.toefl,
            summary: values.eligibilitySummary,
          },
          funding: { tuitionCoverage: values.tuitionCoverage, monthlyStipend: values.monthlyStipend ? Number(values.monthlyStipend) : null, notes: values.fundingNotes },
          application: {
            method: values.applicationMethod,
            fee: values.applicationFee ? Number(values.applicationFee) : null,
            nominationRequired: values.nominationRequired || "unknown",
            professorContactRequired: values.professorContactRequired || "unknown",
            steps: values.applicationSteps,
          },
          documentKeys: String(values.documents ?? "").split(",").map((item) => item.trim()).filter(Boolean),
          acknowledgeDuplicate: values.acknowledgeDuplicate === true,
        });
        return result.ok ? { ok: true, data: result.data } : result;
      }}
      fields={[
        { section: "Overview", name: "name", label: "Scholarship name", required: true },
        { section: "Overview", name: "provider", label: "Provider", required: true },
        { section: "Overview", name: "countryId", label: "Country", type: "select", lookup: "country", options: countries, required: true },
        { section: "Overview", name: "officialUrl", label: "Official link", type: "url" },
        { section: "Overview", name: "applicationUrl", label: "Application link", type: "url" },
        { section: "Overview", name: "researchStatus", label: "Research status", type: "select", options: ["new", "researching", "fact_checking", "verified", "needs_correction", "rejected"].map((value) => ({ value, label: value })) },
        { section: "Overview", name: "publicationStatus", label: "Publication status", type: "select", options: ["not_ready", "preparing", "ready_for_review", "approved", "published", "unpublished"].map((value) => ({ value, label: value })) },
        { section: "Dates", name: "openingDate", label: "Opening date", type: "date" },
        { section: "Dates", name: "closingDate", label: "Closing date", type: "date" },
        { section: "Dates", name: "timezone", label: "Timezone" },
        { section: "Eligibility", name: "nationality", label: "Nationality" },
        { section: "Eligibility", name: "bangladeshEligible", label: "Bangladesh eligible", type: "select", options: ["unknown", "yes", "no"].map((value) => ({ value, label: value })) },
        { section: "Eligibility", name: "internationalEligible", label: "International students", type: "select", options: ["unknown", "yes", "no"].map((value) => ({ value, label: value })) },
        { section: "Eligibility", name: "minimumGpa", label: "Minimum GPA" },
        { section: "Eligibility", name: "ielts", label: "IELTS" },
        { section: "Eligibility", name: "toefl", label: "TOEFL" },
        { section: "Eligibility", name: "eligibilitySummary", label: "Eligibility summary", type: "textarea" },
        { section: "Funding", name: "tuitionCoverage", label: "Tuition coverage" },
        { section: "Funding", name: "monthlyStipend", label: "Monthly stipend", type: "number" },
        { section: "Funding", name: "fundingNotes", label: "Funding notes", type: "textarea" },
        { section: "Application", name: "applicationMethod", label: "Application method" },
        { section: "Application", name: "applicationFee", label: "Application fee", type: "number" },
        { section: "Application", name: "nominationRequired", label: "Nomination required", type: "select", options: ["unknown", "yes", "no"].map((value) => ({ value, label: value })) },
        { section: "Application", name: "professorContactRequired", label: "Professor contact required", type: "select", options: ["unknown", "yes", "no"].map((value) => ({ value, label: value })) },
        { section: "Application", name: "applicationSteps", label: "Application steps", type: "textarea" },
        { section: "Documents", name: "documents", label: "Document keys, comma separated", type: "textarea" },
      ]}
    />
  );
}
