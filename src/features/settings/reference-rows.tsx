"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CountryRow = { id: string; name: string; code: string; displayOrder?: number; active?: boolean };
type CatalogRow = { id: string; name: string; description?: string };
type StatusRow = { id: string; scope: string; key: string; label: string; displayOrder?: number };

export function CountryRows({
  rows,
  onSave,
  onDelete,
}: {
  rows: CountryRow[];
  onSave: (formData: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: { message: string } }>;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <EditableCountry key={row.id} row={row} onSave={onSave} onDelete={onDelete} />
      ))}
    </div>
  );
}

function EditableCountry({
  row,
  onSave,
  onDelete,
}: {
  row: CountryRow;
  onSave: (formData: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: { message: string } }>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2">
        <p className="type-16">
          {row.name} <span className="type-14">({row.code})</span>
          {row.active === false ? <span className="type-14"> · inactive</span> : null}
        </p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete country “${row.name}”? Existing records keep the old id until you reassign them.`)) return;
              startTransition(async () => {
                const result = await onDelete(row.id);
                if (!result.ok) setMessage(result.error?.message ?? "Could not delete.");
                else router.refresh();
              });
            }}
          >
            Delete
          </Button>
        </div>
        {message ? <p className="w-full text-sm text-danger" role="alert">{message}</p> : null}
      </div>
    );
  }

  return (
    <form
      className="grid gap-2 border-b border-line py-3 md:grid-cols-2 xl:grid-cols-5"
      action={async (formData) => {
        await onSave(formData);
        setEditing(false);
        router.refresh();
      }}
    >
      <input type="hidden" name="id" value={row.id} />
      <Input name="name" defaultValue={row.name} placeholder="Name" required aria-label={`Rename ${row.name}`} />
      <Input name="code" defaultValue={row.code} placeholder="Code" required />
      <Input name="displayOrder" type="number" defaultValue={row.displayOrder ?? 0} placeholder="Order" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" value="true" defaultChecked={row.active !== false} className="accent-primary" />
        Active
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm">Save name</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </form>
  );
}

export function CatalogRows({
  rows,
  onSave,
  onDelete,
}: {
  rows: CatalogRow[];
  onSave: (formData: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: { message: string } }>;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <EditableCatalog key={row.id} row={row} onSave={onSave} onDelete={onDelete} />
      ))}
    </div>
  );
}

function EditableCatalog({
  row,
  onSave,
  onDelete,
}: {
  row: CatalogRow;
  onSave: (formData: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: { message: string } }>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2">
        <p className="type-16">{row.name}{row.description ? <span className="type-14"> · {row.description}</span> : null}</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete “${row.name}”?`)) return;
              startTransition(async () => {
                const result = await onDelete(row.id);
                if (!result.ok) setMessage(result.error?.message ?? "Could not delete.");
                else router.refresh();
              });
            }}
          >
            Delete
          </Button>
        </div>
        {message ? <p className="w-full text-sm text-danger" role="alert">{message}</p> : null}
      </div>
    );
  }

  return (
    <form
      className="grid gap-2 border-b border-line py-3 md:grid-cols-3"
      action={async (formData) => {
        await onSave(formData);
        setEditing(false);
        router.refresh();
      }}
    >
      <input type="hidden" name="id" value={row.id} />
      <Input name="name" defaultValue={row.name} placeholder="Name" required />
      <Input name="description" defaultValue={row.description ?? ""} placeholder="Description" />
      <div className="flex gap-2">
        <Button type="submit" size="sm">Save</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </form>
  );
}

export function StatusRows({
  rows,
  onSave,
  onDelete,
}: {
  rows: StatusRow[];
  onSave: (formData: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: { message: string } }>;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <EditableStatus key={row.id} row={row} onSave={onSave} onDelete={onDelete} />
      ))}
    </div>
  );
}

function EditableStatus({
  row,
  onSave,
  onDelete,
}: {
  row: StatusRow;
  onSave: (formData: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: { message: string } }>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2">
        <p className="type-16">{row.scope} · {row.label} <span className="type-14">({row.key})</span></p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete status “${row.label}”?`)) return;
              startTransition(async () => {
                const result = await onDelete(row.id);
                if (!result.ok) setMessage(result.error?.message ?? "Could not delete.");
                else router.refresh();
              });
            }}
          >
            Delete
          </Button>
        </div>
        {message ? <p className="w-full text-sm text-danger" role="alert">{message}</p> : null}
      </div>
    );
  }

  return (
    <form
      className="grid gap-2 border-b border-line py-3 md:grid-cols-2 xl:grid-cols-5"
      action={async (formData) => {
        await onSave(formData);
        setEditing(false);
        router.refresh();
      }}
    >
      <input type="hidden" name="id" value={row.id} />
      <Input name="scope" defaultValue={row.scope} placeholder="Scope" required />
      <Input name="key" defaultValue={row.key} placeholder="Key" required />
      <Input name="label" defaultValue={row.label} placeholder="Label" required />
      <Input name="displayOrder" type="number" defaultValue={row.displayOrder ?? 0} placeholder="Order" />
      <div className="flex gap-2">
        <Button type="submit" size="sm">Save</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </form>
  );
}
