"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { bulkArchiveProfessorsAction } from "@/server/actions/mutations";

export function ProfessorBulkBar({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      id="professor-bulk"
      className="mb-3 hidden md:block"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const selected = Array.from(new FormData(form).getAll("ids")).map(String);
        if (!selected.length) {
          setMessage("Select at least one professor.");
          return;
        }
        if (!window.confirm(`Archive ${selected.length} professor${selected.length === 1 ? "" : "s"}?`)) return;
        setPending(true);
        setMessage("");
        const result = await bulkArchiveProfessorsAction(selected);
        setPending(false);
        if (!result.ok) {
          setMessage(result.error.message);
          return;
        }
        router.refresh();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="danger-pill" disabled={pending}>
          {pending ? "Archiving…" : "Archive selected"}
        </button>
        <span className="type-14">Select rows in the table, then archive.</span>
      </div>
      {message ? <p className="type-14 mt-2 text-danger" role="alert">{message}</p> : null}
      {/* Keep ids available for empty selection messaging */}
      <span className="sr-only">{ids.length} professors on this page</span>
    </form>
  );
}
