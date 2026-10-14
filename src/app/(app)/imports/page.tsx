"use client";

import { useState } from "react";
import { importAction } from "@/server/actions/mutations";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ImportsPage() {
  const [entityType, setEntityType] = useState("scholarship");
  const [csv, setCsv] = useState("");
  const [summary, setSummary] = useState<string>("");
  return (
    <div>
      <PageHeader title="Import" description="Paste CSV or JSON. Verified values are not overwritten. Duplicates are skipped unless you confirm them." />
      <SectionCard title="Upload / paste">
        <div className="grid gap-3">
          <Select aria-label="Import type" value={entityType} onChange={(event) => setEntityType(event.target.value)} options={[{ value: "scholarship", label: "Scholarships" }, { value: "university", label: "Universities" }, { value: "professor", label: "Professors" }, { value: "opportunity", label: "Opportunities" }]} />
          <Textarea aria-label="Import data" value={csv} onChange={(event) => setCsv(event.target.value)} placeholder="name,provider,countryId,officialUrl" />
          <div className="flex gap-2">
            <Button type="button" onClick={async () => { const result = await importAction(entityType, csv, false); setSummary(JSON.stringify(result, null, 2)); }}>Validate and import</Button>
            <Button type="button" variant="secondary" onClick={async () => { const result = await importAction(entityType, csv, true); setSummary(JSON.stringify(result, null, 2)); }}>Import including duplicates</Button>
          </div>
          {summary ? <pre className="overflow-auto rounded-xl bg-canvas p-3 text-xs">{summary}</pre> : null}
        </div>
      </SectionCard>
    </div>
  );
}
