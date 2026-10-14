"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type LegacyColumnDef } from "@tanstack/react-table/legacy";
import { DataTable, type RowRecord } from "@/components/tables/data-table";
import { bulkArchiveProfessorsAction, saveProfessorAction } from "@/server/actions/mutations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProfessorGrid({ rows }: { rows: RowRecord[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const columns: LegacyColumnDef<RowRecord>[] = [
    { accessorKey: "name", header: "Professor", cell: ({ row }) => <Link className="font-medium text-primary" href={`/professors/records/${row.original.id}`}>{String(row.original.name)}</Link> },
    { accessorKey: "designation", header: "Designation" },
    { accessorKey: "email", header: "Email", cell: ({ row }) => <InlineEmail row={row.original} onSaved={() => router.refresh()} /> },
    { accessorKey: "researchAreas", header: "Research areas" },
  ];
  return (
    <div>
      {message ? <p className="mb-2 text-sm text-danger" role="alert">{message}</p> : null}
      <DataTable
        rows={rows}
        columns={columns}
        selectable
        freezeFirst
        onSelection={async (ids) => {
          const result = await bulkArchiveProfessorsAction(ids);
          if (!result.ok) setMessage(result.error.message);
          else router.refresh();
        }}
      />
    </div>
  );
}

function InlineEmail({ row, onSaved }: { row: RowRecord; onSaved: () => void }) {
  const [value, setValue] = useState(String(row.email ?? ""));
  return (
    <form
      className="flex gap-1"
      onSubmit={async (event) => {
        event.preventDefault();
        await saveProfessorAction({ id: row.id, version: row.version, email: value, inline: true, name: row.name });
        onSaved();
      }}
    >
      <Input aria-label={`Email for ${row.name}`} value={value} onChange={(event) => setValue(event.target.value)} />
      <Button type="submit" size="sm" variant="secondary">Save</Button>
    </form>
  );
}
