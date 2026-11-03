import { notFound } from "next/navigation";
import { getScholarship } from "@/server/services/scholarships";
import { listCountries } from "@/server/services/settings";
import { assertPermission, getCurrentUser } from "@/server/auth/current-user";
import { ScholarshipForm } from "@/features/scholarships/scholarship-form";
import { PageHeader } from "@/components/layout/page";
import { dateInputValue, stringField } from "@/lib/record-defaults";
import { AppError } from "@/lib/errors";

export default async function EditScholarshipPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  assertPermission(user, "scholarship.update");
  const { id } = await params;
  let record: Record<string, unknown>;
  try {
    record = await getScholarship(id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const eligibility = (record.eligibility ?? {}) as Record<string, unknown>;
  const funding = (record.funding ?? {}) as Record<string, unknown>;
  const application = (record.application ?? {}) as Record<string, unknown>;
  const countries = (await listCountries()).filter((country) => country.active !== false).map((country) => ({ value: String(country.id), label: String(country.name) }));
  return (
    <div>
      <PageHeader title="Edit scholarship" description="Correct wrong facts from an official source, then save." />
      <ScholarshipForm
        countries={countries}
        defaults={{
          id,
          version: stringField(record.version ?? 1),
          name: stringField(record.name),
          provider: stringField(record.provider),
          countryId: stringField(record.countryId),
          officialUrl: stringField(record.officialUrl),
          applicationUrl: stringField(record.applicationUrl),
          researchStatus: stringField(record.researchStatus || "new"),
          publicationStatus: stringField(record.publicationStatus || "not_ready"),
          openingDate: dateInputValue(record.openingDate),
          closingDate: dateInputValue(record.closingDate),
          timezone: stringField(record.timezone || "UTC"),
          nationality: stringField(eligibility.nationality),
          bangladeshEligible: stringField(eligibility.bangladeshEligible || "unknown"),
          internationalEligible: stringField(eligibility.internationalStudentsEligible || "unknown"),
          minimumGpa: stringField(eligibility.minimumGpa),
          ielts: stringField(eligibility.ielts),
          toefl: stringField(eligibility.toefl),
          eligibilitySummary: stringField(eligibility.summary),
          tuitionCoverage: stringField(funding.tuitionCoverage),
          monthlyStipend: funding.monthlyStipend == null ? "" : String(funding.monthlyStipend),
          fundingNotes: stringField(funding.notes),
          applicationMethod: stringField(application.method),
          applicationFee: application.fee == null ? "" : String(application.fee),
          nominationRequired: stringField(application.nominationRequired || "unknown"),
          professorContactRequired: stringField(application.professorContactRequired || "unknown"),
          applicationSteps: stringField(application.steps),
          documents: Array.isArray(record.documentKeys) ? record.documentKeys.map(String).join(", ") : "",
        }}
      />
    </div>
  );
}
