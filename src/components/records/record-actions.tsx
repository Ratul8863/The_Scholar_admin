"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type ActionResult = { ok: true } | { ok: false; error: { message: string } };

export function RecordActions({
  editHref,
  canEdit,
  canArchive,
  archiveLabel = "Archive",
  onArchive,
  afterArchiveHref,
}: {
  editHref?: string;
  canEdit?: boolean;
  canArchive?: boolean;
  archiveLabel?: string;
  onArchive?: () => Promise<ActionResult>;
  afterArchiveHref?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  if (!canEdit && !canArchive) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canEdit && editHref ? (
        <Button asChild variant="outline" size="sm">
          <Link href={editHref} prefetch={false}>Edit</Link>
        </Button>
      ) : null}
      {canArchive && onArchive ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Archive this record? It will leave active lists but stay in history.")) return;
            setMessage("");
            startTransition(async () => {
              const result = await onArchive();
              if (!result.ok) {
                setMessage(result.error.message);
                return;
              }
              if (afterArchiveHref) router.push(afterArchiveHref);
              else router.refresh();
            });
          }}
        >
          {pending ? "Archiving…" : archiveLabel}
        </Button>
      ) : null}
      {message ? <p className="w-full text-sm text-danger" role="alert">{message}</p> : null}
    </div>
  );
}
