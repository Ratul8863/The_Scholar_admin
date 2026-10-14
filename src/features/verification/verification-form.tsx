"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { panelClass } from "@/components/ui/styles";

const states = ["checked", "not_checked", "needs_correction", "not_applicable"];

export function VerificationForm({
  entityType,
  entityId,
  items,
  save,
}: {
  entityType: string;
  entityId: string;
  items: { key: string; label: string; required: boolean; state: string; note: string }[];
  save: (input: Record<string, unknown>) => Promise<{ ok: boolean; error?: { message: string } }>;
}) {
  const [rows, setRows] = useState(items);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const result = await save({ entityType, entityId, items: rows });
          if (!result.ok) setMessage(result.error?.message ?? "Could not save.");
          else router.refresh();
        });
      }}
    >
      {rows.map((row, index) => (
        <fieldset key={row.key} className={`${panelClass} p-3 sm:p-4`}>
          <legend className="px-1 text-sm font-medium">{row.label}{row.required ? " (required)" : ""}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-[220px_1fr]">
            <Select aria-label={`${row.label} state`} value={row.state} options={states.map((state) => ({ value: state, label: state.replaceAll("_", " ") }))} onChange={(event) => setRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, state: event.target.value } : item))} />
            <Textarea aria-label={`${row.label} note`} value={row.note} onChange={(event) => setRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, note: event.target.value } : item))} />
          </div>
        </fieldset>
      ))}
      {message ? <p className="text-sm text-danger" role="alert">{message}</p> : null}
      <Button disabled={pending} aria-busy={pending}>{pending ? "Saving" : "Save checklist"}</Button>
    </form>
  );
}
