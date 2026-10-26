import "server-only";
import { Country, CustomFieldDefinition, DegreeLevel, DocumentType, FieldOfStudy, FundingType, ResearchArea, Role, StatusConfiguration, SystemSettings, VerificationTemplate } from "@/models";
import { AppError } from "@/lib/errors";
import { asRecord } from "@/lib/serialize";
import { forgetCachedUsers, type CurrentUser } from "@/server/auth/current-user";
import { CUSTOM_FIELD_TYPES } from "@/server/domain/custom-fields";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { cacheClear, cacheLoad } from "@/server/cache";
import { writeAudit } from "@/server/services/audit";
import { oid, ready } from "@/server/services/query";

function cached<T>(key: string, load: () => Promise<T>, ttl = 300_000): Promise<T> {
  return cacheLoad(key, load, ttl);
}

function clearReferenceCache() {
  cacheClear();
}

const catalogs = {
  degreeLevels: DegreeLevel,
  fundingTypes: FundingType,
  fieldsOfStudy: FieldOfStudy,
  researchAreas: ResearchArea,
  documentTypes: DocumentType,
} as const;

export async function getSettings() {
  return cached("settings", async () => {
    await ready();
    const settings = await SystemSettings.findOne({ key: "default" }).select("deadlineWarningDays openingSoonDays newInformationDays publicationRequirements").lean();
    return {
      deadlineWarningDays: settings?.deadlineWarningDays ?? 14,
      openingSoonDays: settings?.openingSoonDays ?? 30,
      newInformationDays: settings?.newInformationDays ?? 14,
      publicationRequirements: settings?.publicationRequirements ?? [],
    };
  });
}

export async function updateSettings(user: CurrentUser, input: Record<string, unknown>) {
  const before = await getSettings();
  await SystemSettings.updateOne(
    { key: "default" },
    {
      $set: {
        deadlineWarningDays: Number(input.deadlineWarningDays ?? before.deadlineWarningDays),
        openingSoonDays: Number(input.openingSoonDays ?? before.openingSoonDays),
        newInformationDays: Number(input.newInformationDays ?? before.newInformationDays),
        publicationRequirements: String(input.publicationRequirements ?? "").split("\n").map((item) => item.trim()).filter(Boolean),
      },
    },
    { upsert: true },
  );
  await writeAudit({ actorUserId: user.id, action: "edit", entityType: "settings", entityId: "default", metadata: { before } });
  clearReferenceCache();
}

export async function listCountries() {
  return cached("countries", async () => {
    await ready();
    return (await Country.find().sort({ displayOrder: 1, name: 1 }).select("name code flag active displayOrder").lean()).map((row) => asRecord(row));
  });
}

export async function saveCountry(user: CurrentUser, input: Record<string, unknown>) {
  const name = String(input.name ?? "").trim();
  const code = String(input.code ?? "").trim().toUpperCase();
  if (name.length < 2 || code.length < 2) throw new AppError("validation", "Country name and code are required.");
  if (input.id) {
    await Country.updateOne({ _id: oid(String(input.id)) }, { $set: { name, code, flag: String(input.flag ?? ""), active: input.active !== false, displayOrder: Number(input.displayOrder ?? 0) } });
    await writeAudit({ actorUserId: user.id, action: "edit", entityType: "country", entityId: String(input.id) });
    clearReferenceCache();
    return String(input.id);
  }
  const doc = await Country.create({ name, code, flag: String(input.flag ?? ""), active: true, displayOrder: Number(input.displayOrder ?? 0), createdBy: oid(user.id) });
  await writeAudit({ actorUserId: user.id, action: "create", entityType: "country", entityId: String(doc._id) });
  clearReferenceCache();
  return String(doc._id);
}

export async function listCatalog(kind: keyof typeof catalogs) {
  return cached(`catalog:${kind}`, async () => {
    await ready();
    return (await catalogs[kind].find().sort({ displayOrder: 1, name: 1 }).select("key name description active displayOrder").lean()).map((row) => asRecord(row));
  });
}

export async function saveCatalogItem(user: CurrentUser, kind: keyof typeof catalogs, input: Record<string, unknown>) {
  const name = String(input.name ?? "").trim();
  const key = String(input.key ?? name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (!name || !key) throw new AppError("validation", "Name is required.");
  const model = catalogs[kind];
  if (input.id) {
    await model.updateOne({ _id: oid(String(input.id)) }, { $set: { name, description: String(input.description ?? ""), active: input.active !== false, displayOrder: Number(input.displayOrder ?? 0) } });
    clearReferenceCache();
    return String(input.id);
  }
  const doc = await model.create({ key, name, description: String(input.description ?? ""), displayOrder: Number(input.displayOrder ?? 0) });
  await writeAudit({ actorUserId: user.id, action: "create", entityType: kind, entityId: String(doc._id) });
  clearReferenceCache();
  return String(doc._id);
}

export async function listStatuses() {
  return cached("statuses", async () => {
    await ready();
    return (await StatusConfiguration.find().sort({ scope: 1, displayOrder: 1 }).lean()).map((row) => asRecord(row));
  });
}

export async function saveStatus(user: CurrentUser, input: Record<string, unknown>) {
  const scope = String(input.scope ?? "");
  const key = String(input.key ?? "").trim();
  const label = String(input.label ?? "").trim();
  if (!scope || !key || !label) throw new AppError("validation", "Scope, key, and label are required.");
  await StatusConfiguration.updateOne({ scope, key }, { $set: { label, active: input.active !== false, displayOrder: Number(input.displayOrder ?? 0) } }, { upsert: true });
  await writeAudit({ actorUserId: user.id, action: "edit", entityType: "status", entityId: `${scope}:${key}` });
  clearReferenceCache();
}

export async function listCustomFields(entityType?: string) {
  return cached(`fields:${entityType ?? "all"}`, async () => {
    await ready();
    const filter = entityType ? { entityType } : {};
    return (await CustomFieldDefinition.find(filter).sort({ entityType: 1, displayOrder: 1 }).lean()).map((row) => asRecord(row));
  });
}

export async function saveCustomField(user: CurrentUser, input: Record<string, unknown>) {
  const entityType = String(input.entityType ?? "");
  const label = String(input.label ?? "").trim();
  const type = String(input.type ?? "");
  const fieldKey = String(input.fieldKey ?? label).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (!entityType || !label || !CUSTOM_FIELD_TYPES.includes(type as (typeof CUSTOM_FIELD_TYPES)[number])) {
    throw new AppError("validation", "Entity, label, and a supported field type are required.");
  }
  await CustomFieldDefinition.updateOne(
    { entityType, fieldKey },
    {
      $set: {
        label,
        type,
        description: String(input.description ?? ""),
        required: input.required === true,
        options: String(input.options ?? "").split(",").map((item) => item.trim()).filter(Boolean),
        displayOrder: Number(input.displayOrder ?? 0),
        visibility: input.visibility === "hidden" ? "hidden" : "visible",
        editable: input.editable !== false,
        active: input.active !== false,
        createdBy: oid(user.id),
      },
    },
    { upsert: true },
  );
  await writeAudit({ actorUserId: user.id, action: "edit", entityType: "customField", entityId: `${entityType}:${fieldKey}`, metadata: { type, label } });
  clearReferenceCache();
}

export async function listRoles() {
  return cached("roles", async () => {
    await ready();
    return (await Role.find().sort({ name: 1 }).select("key name description permissions system").lean()).map((row) => asRecord(row));
  });
}

export async function updateRolePermissions(user: CurrentUser, roleId: string, permissions: string[]) {
  const unknown = permissions.filter((permission) => !PERMISSIONS.includes(permission as (typeof PERMISSIONS)[number]));
  if (unknown.length) throw new AppError("validation", "Unknown permission.");
  const role = await Role.findById(oid(roleId));
  if (!role) throw new AppError("not_found", "Role was not found.");
  if (role.key === "admin" && !permissions.includes("team.manage")) {
    throw new AppError("validation", "The admin role must keep team management.");
  }
  const before = [...role.permissions];
  role.permissions = permissions;
  await role.save();
  clearReferenceCache();
  forgetCachedUsers();
  await writeAudit({
    actorUserId: user.id,
    action: "edit",
    entityType: "role",
    entityId: roleId,
    changes: [{ field: "permissions", oldValue: before, newValue: permissions }],
  });
}

export async function listTemplates() {
  return cached("templates", async () => {
    await ready();
    return (await VerificationTemplate.find().sort({ entityType: 1 }).lean()).map((row) => asRecord(row));
  });
}

export async function saveTemplate(user: CurrentUser, input: Record<string, unknown>) {
  const entityType = String(input.entityType ?? "");
  const name = String(input.name ?? "").trim();
  const items = String(input.items ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [label, flag] = line.split("|");
      const key = (label ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
      return { key, label: (label ?? "").trim(), required: flag?.trim() === "required", displayOrder: index };
    });
  if (!entityType || !name || items.length === 0) throw new AppError("validation", "Add a name and at least one checklist item.");
  const doc = await VerificationTemplate.findOneAndUpdate({ entityType, name }, { $set: { items, active: true } }, { upsert: true, new: true });
  await writeAudit({ actorUserId: user.id, action: "edit", entityType: "verificationTemplate", entityId: String(doc._id) });
  clearReferenceCache();
  return String(doc._id);
}

export { catalogs };
