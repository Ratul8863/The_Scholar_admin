import { readFileSync, existsSync } from "node:fs";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { Role, User } from "../src/models/identity";
import { Country, DegreeLevel, DocumentType, FundingType, StatusConfiguration, SystemSettings } from "../src/models/reference";
import { VerificationTemplate } from "../src/models/platform";
import { DEFAULT_ROLE_PERMISSIONS, ROLE_LABELS } from "../src/server/permissions/catalog";
import { passwordIssues } from "../src/server/domain/text";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const degrees = ["Bachelor", "Master", "Doctoral", "Diploma", "Certificate", "Non-degree", "Other"];
const funding = ["Fully Funded", "Fully Funded / Partial", "Partially Funded", "Tuition Waiver", "Tuition Reduction", "Stipend", "Living Allowance", "Travel Grant", "Accommodation", "Insurance", "Application Fee Waiver", "Research Funding", "Other", "Self Funded"];
const documents = ["Passport", "National ID", "Birth Certificate", "Transcript", "Academic Certificate", "Recommendation Letter", "SOP", "Personal Statement", "CV", "Study Plan", "Research Proposal", "Motivation Letter", "Financial Documents", "Language Certificate", "Portfolio", "Medical Certificate", "Other"];
const researchStatuses = ["New", "Researching", "Fact Checking", "Verified", "Needs Correction", "Rejected"];
const publicationStatuses = ["Not Ready", "Preparing", "Ready for Review", "Approved", "Published", "Unpublished"];

async function main() {
  const uri = process.env.MONGODB_URI;
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Scholar Admin";
  if (!uri) throw new Error("MONGODB_URI is required.");
  if (!email || passwordIssues(password).length) throw new Error("Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 12 characters with a letter and a number.");

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "scholar" });
  for (const [key, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    await Role.updateOne({ key }, { $set: { name: ROLE_LABELS[key], permissions, system: true, description: `${ROLE_LABELS[key]} default access` } }, { upsert: true });
  }
  const adminRole = await Role.findOne({ key: "admin" });
  if (!adminRole) throw new Error("Admin role was not created.");

  for (const [index, label] of degrees.entries()) {
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    await DegreeLevel.updateOne({ key }, { $set: { name: label, displayOrder: index, active: true } }, { upsert: true });
  }
  for (const [index, label] of funding.entries()) {
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    await FundingType.updateOne({ key }, { $set: { name: label, displayOrder: index, active: true } }, { upsert: true });
  }
  for (const [index, label] of documents.entries()) {
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    await DocumentType.updateOne({ key }, { $set: { name: label, displayOrder: index, active: true } }, { upsert: true });
  }
  for (const [index, label] of researchStatuses.entries()) {
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    await StatusConfiguration.updateOne({ scope: "research", key }, { $set: { label, displayOrder: index, active: true } }, { upsert: true });
  }
  for (const [index, label] of publicationStatuses.entries()) {
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    await StatusConfiguration.updateOne({ scope: "publication", key }, { $set: { label, displayOrder: index, active: true } }, { upsert: true });
  }

  const checklist = ["Official source | required", "Name and provider | required", "Dates checked | required", "Eligibility checked", "Funding checked"];
  for (const entityType of ["scholarship", "university", "program", "professor", "opportunity", "emergency"]) {
    await VerificationTemplate.updateOne(
      { entityType, name: "Default checklist" },
      {
        $set: {
          active: true,
          items: checklist.map((line, index) => {
            const [label, flag] = line.split("|");
            return { key: label!.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: label!.trim(), required: flag?.trim() === "required", displayOrder: index };
          }),
        },
      },
      { upsert: true },
    );
  }

  await SystemSettings.updateOne(
    { key: "default" },
    { $set: { deadlineWarningDays: 14, openingSoonDays: 30, newInformationDays: 14, publicationRequirements: ["Verified official source", "Title", "Explicit publish action"] } },
    { upsert: true },
  );

  const existing = await User.findOne({ email }).select("+passwordHash");
  if (!existing) {
    await User.create({ name, email, passwordHash: await hash(password, 12), roleId: adminRole._id, active: true, emailVerifiedAt: new Date() });
    console.info(`Created admin ${email}`);
  } else {
    console.info(`Admin ${email} already exists`);
  }
  const countryCount = await Country.countDocuments();
  await import("../src/models");
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).createIndexes().catch(() => undefined)));
  console.info(`Reference data ready. Countries in database: ${countryCount}. No research records were seeded.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
