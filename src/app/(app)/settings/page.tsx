import { listCatalog, listCountries, listCustomFields, listRoles, listStatuses, listTemplates, getSettings } from "@/server/services/settings";
import {
  deleteCatalogAction,
  deleteCountryAction,
  deleteStatusAction,
  saveCatalogAction,
  saveCountryAction,
  saveCustomFieldAction,
  saveSettingsAction,
  saveStatusAction,
  saveTemplateAction,
} from "@/server/actions/mutations";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CUSTOM_FIELD_TYPES } from "@/server/domain/custom-fields";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { RoleEditor } from "@/features/settings/role-editor";
import { CatalogRows, CountryRows, StatusRows } from "@/features/settings/reference-rows";

export default async function SettingsPage() {
  const [countries, degrees, funding, fields, areas, documents, statuses, customFields, roles, templates, settings] = await Promise.all([
    listCountries(),
    listCatalog("degreeLevels"),
    listCatalog("fundingTypes"),
    listCatalog("fieldsOfStudy"),
    listCatalog("researchAreas"),
    listCatalog("documentTypes"),
    listStatuses(),
    listCustomFields(),
    listRoles(),
    listTemplates(),
    getSettings(),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Configurable reference data. Rename and delete are allowed for countries, catalogs, and statuses." />
      <SectionCard title="Countries">
        <div id="countries" className="scroll-mt-24">
          <p className="type-14 mb-3">Shared by universities, scholarships, and professor research. You can rename any country; the new name appears everywhere.</p>
          <CountryRows
            rows={countries.map((country) => ({
              id: String(country.id),
              name: String(country.name),
              code: String(country.code ?? ""),
              displayOrder: Number(country.displayOrder ?? 0),
              active: country.active !== false,
            }))}
            onSave={saveCountryAction}
            onDelete={deleteCountryAction}
          />
          <form action={saveCountryAction} className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <Input name="name" placeholder="Name" required />
            <Input name="code" placeholder="Code" required />
            <Input name="displayOrder" type="number" placeholder="Order" />
            <Button type="submit">Add country</Button>
          </form>
        </div>
      </SectionCard>
      <Catalog title="Degree levels" kind="degreeLevels" rows={degrees} />
      <Catalog title="Funding types" kind="fundingTypes" rows={funding} />
      <Catalog title="Fields of study" kind="fieldsOfStudy" rows={fields} />
      <Catalog title="Research areas" kind="researchAreas" rows={areas} />
      <Catalog title="Document types" kind="documentTypes" rows={documents} />
      <SectionCard title="Statuses">
        <p className="type-14 mb-3">Edit labels or delete unused status values. Scope and key identify where the status is used.</p>
        <StatusRows
          rows={statuses.map((status) => ({
            id: String(status.id),
            scope: String(status.scope),
            key: String(status.key),
            label: String(status.label),
            displayOrder: Number(status.displayOrder ?? 0),
          }))}
          onSave={saveStatusAction}
          onDelete={deleteStatusAction}
        />
        <form action={saveStatusAction} className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <Input name="scope" placeholder="Scope" required />
          <Input name="key" placeholder="Key" required />
          <Input name="label" placeholder="Label" required />
          <Button type="submit">Add status</Button>
        </form>
      </SectionCard>
      <SectionCard title="Custom fields">
        <ul className="mb-3 text-sm">{customFields.map((field) => <li key={String(field.id)}>{String(field.entityType)} · {String(field.label)} · {String(field.type)}</li>)}</ul>
        <form action={saveCustomFieldAction} className="grid gap-2 sm:grid-cols-2">
          <Input name="entityType" placeholder="Entity type, e.g. scholarship" required />
          <Input name="label" placeholder="Label" required />
          <Select name="type" aria-label="Field type" options={CUSTOM_FIELD_TYPES.map((type) => ({ value: type, label: type }))} />
          <Input name="options" placeholder="Options, comma separated" />
          <Button type="submit">Save custom field</Button>
        </form>
      </SectionCard>
      <SectionCard title="Roles">
        <RoleEditor roles={roles.map((role) => ({ id: String(role.id), name: String(role.name), permissions: (role.permissions as string[]) ?? [] }))} permissions={[...PERMISSIONS]} />
      </SectionCard>
      <SectionCard title="Verification templates">
        <ul className="mb-3 text-sm">{templates.map((template) => <li key={String(template.id)}>{String(template.entityType)} · {String(template.name)}</li>)}</ul>
        <form action={saveTemplateAction} className="grid gap-2">
          <Input name="entityType" placeholder="Entity type" required />
          <Input name="name" placeholder="Template name" required />
          <Textarea name="items" placeholder={"Official source | required\nDates checked"} required />
          <Button type="submit">Save template</Button>
        </form>
      </SectionCard>
      <SectionCard title="System">
        <form action={saveSettingsAction} className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">Deadline warning days<Input name="deadlineWarningDays" type="number" defaultValue={settings.deadlineWarningDays} /></label>
          <label className="text-sm">Opening soon days<Input name="openingSoonDays" type="number" defaultValue={settings.openingSoonDays} /></label>
          <label className="text-sm sm:col-span-2">Publication requirements<Textarea name="publicationRequirements" defaultValue={settings.publicationRequirements.join("\n")} /></label>
          <Button type="submit">Save system settings</Button>
        </form>
      </SectionCard>
    </div>
  );
}

function Catalog({
  title,
  kind,
  rows,
}: {
  title: string;
  kind: "degreeLevels" | "fundingTypes" | "fieldsOfStudy" | "researchAreas" | "documentTypes";
  rows: Record<string, unknown>[];
}) {
  return (
    <SectionCard title={title}>
      <CatalogRows
        rows={rows.map((row) => ({ id: String(row.id), name: String(row.name), description: String(row.description ?? "") }))}
        onSave={saveCatalogAction.bind(null, kind)}
        onDelete={deleteCatalogAction.bind(null, kind)}
      />
      <form action={saveCatalogAction.bind(null, kind)} className="mt-4 grid gap-2 md:grid-cols-3">
        <Input name="name" placeholder="Name" required />
        <Input name="description" placeholder="Description" />
        <Button type="submit">Add</Button>
      </form>
    </SectionCard>
  );
}
