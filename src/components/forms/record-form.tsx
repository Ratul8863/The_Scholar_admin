"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { AlertCard } from "@/components/ui/card";
import { Combobox } from "@/components/ui/choice";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { panelClass } from "@/components/ui/styles";

type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "date" | "number" | "select" | "url";
  options?: { value: string; label: string }[];
  lookup?: "country" | "university" | "professor";
  section: string;
  required?: boolean;
};

type Result = { ok: true; data: { id: string } } | { ok: false; error: { message: string; code: string; details?: unknown } };

export function RecordForm({
  fields,
  defaults,
  onSave,
  submitLabel = "Save",
}: {
  fields: Field[];
  defaults?: Record<string, string>;
  onSave: (values: Record<string, unknown>) => Promise<Result>;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [duplicates, setDuplicates] = useState<{ id: string; name: string }[]>([]);
  const [pending, startTransition] = useTransition();
  const form = useForm<Record<string, string>>({ defaultValues: defaults ?? {} });
  const sections = [...new Set(fields.map((field) => field.section))];

  function submit(values: Record<string, string>, acknowledgeDuplicate = false) {
    setMessage("");
    startTransition(async () => {
      const result = await onSave({ ...values, acknowledgeDuplicate, id: defaults?.id, version: defaults?.version ? Number(defaults.version) : undefined });
      if (!result.ok) {
        setMessage(result.error.message);
        const matches = (result.error.details as { matches?: { id: string; name: string }[] } | undefined)?.matches ?? [];
        setDuplicates(matches);
        return;
      }
      router.push(".");
      router.refresh();
    });
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => submit(values))}>
      {sections.map((section) => (
        <fieldset key={section} className={`${panelClass} p-4 sm:p-5`}>
          <legend className="px-1 text-lg font-normal tracking-tight">{section}</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {fields.filter((field) => field.section === section).map((field) => {
              const fieldId = `field-${field.name}`;
              const registration = form.register(field.name, field.required ? { required: `${field.label} is required.` } : {});
              return (
              <div key={field.name} className={field.type === "textarea" ? "grid gap-1.5 sm:col-span-2" : "grid min-w-0 gap-1.5"}>
                <label htmlFor={fieldId} className="text-sm font-medium">{field.label}{field.required ? <span className="text-danger"> *</span> : null}</label>
                {field.type === "textarea" ? (
                  <Textarea id={fieldId} {...registration} />
                ) : field.lookup ? (
                  <Combobox id={fieldId} lookup={field.lookup} options={field.options} placeholder={`Search ${field.label.toLowerCase()}`} aria-label={field.label} required={field.required} defaultValue={defaults?.[field.name] ?? ""} {...registration} />
                ) : field.type === "select" ? (
                  <Select id={fieldId} aria-label={field.label} defaultValue={defaults?.[field.name] ?? ""} options={[{ value: "", label: "Select" }, ...(field.options ?? [])]} {...registration} />
                ) : (
                  <Input id={fieldId} type={field.type === "date" || field.type === "number" || field.type === "url" ? field.type : "text"} defaultValue={field.type === "date" ? defaults?.[field.name] ?? "" : undefined} {...registration} />
                )}
                {form.formState.errors[field.name] ? <span className="text-xs text-danger" role="alert">{form.formState.errors[field.name]?.message}</span> : null}
              </div>
              );
            })}
          </div>
        </fieldset>
      ))}
      {message ? <AlertCard tone="warning" title="Could not save">{message}</AlertCard> : null}
      {duplicates.length ? (
        <AlertCard tone="warning" title="Possible duplicate" action={
          <span className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setDuplicates([])}>Keep existing</Button>
            <Button type="button" size="sm" onClick={() => submit(form.getValues(), true)}>Create anyway</Button>
          </span>
        }>
          <ul className="space-y-1">
            {duplicates.map((match) => <li key={match.id}>{match.name}</li>)}
          </ul>
        </AlertCard>
      ) : null}
      <div className={`form-actions ${panelClass}`}>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? "Saving" : submitLabel}</Button>
      </div>
    </form>
  );
}
