"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteAdminAction } from "@/server/actions/mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InviteAdminForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  function onSubmit(formData: FormData) {
    setMessage("");
    setInviteUrl("");
    setCopied(false);
    startTransition(async () => {
      const result = await inviteAdminAction({
        email: String(formData.get("email") ?? ""),
        name: String(formData.get("name") ?? ""),
      });
      if (!result.ok) {
        setMessage(result.error.message);
        return;
      }
      setInviteUrl(result.data.inviteUrl);
      setMessage(`Admin invitation sent to ${result.data.email}. They accept the link, set a password, then log in.`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3">
      <form action={onSubmit} className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <Input name="name" placeholder="Name" />
        <Input name="email" type="email" placeholder="Admin email" required />
        <Button type="submit" disabled={pending} className="xl:col-span-2">{pending ? "Creating…" : "Create admin"}</Button>
      </form>
      {message ? <p className="text-sm text-muted" role="status">{message}</p> : null}
      {inviteUrl ? (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate rounded-xl bg-canvas px-3 py-2 text-xs">{inviteUrl}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(inviteUrl);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy invite link"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
