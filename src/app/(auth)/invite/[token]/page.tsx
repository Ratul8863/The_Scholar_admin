import { previewInvitation } from "@/server/services/team";
import { acceptInviteAction } from "@/server/actions/mutations";
import { ScholarLogo } from "@/components/brand/scholar-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const messages: Record<string, string> = {
  expired: "This invitation has expired. Ask an admin for a new one.",
  used: "This invitation was already used.",
  revoked: "This invitation was revoked.",
  invalid: "This invitation is not valid.",
};

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let preview: { state: string; email?: string; roleName?: string } = { state: "invalid" };
  try {
    preview = await previewInvitation(token);
  } catch {
    preview = { state: "invalid", email: "" };
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10 sm:px-6">
      <div className="warm-sheet w-full max-w-md">
        <ScholarLogo className="mb-5 w-44" />
        <h1 className="page-title">Accept invitation</h1>
        {preview.state !== "valid" ? (
          <p className="mt-3 text-sm text-danger" role="alert">{messages[preview.state] ?? messages.invalid}</p>
        ) : (
          <form action={acceptInviteAction} className="mt-4 space-y-3">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="email" value={preview.email} />
            <p className="text-sm text-muted">{preview.email} · {preview.roleName}</p>
            <label className="grid gap-1.5 text-sm">Name<Input name="name" required /></label>
            <label className="grid gap-1.5 text-sm">Password<Input name="password" type="password" required minLength={12} /></label>
            <p className="text-xs text-muted">Use at least 12 characters with a letter and a number.</p>
            <Button className="w-full">Activate account</Button>
          </form>
        )}
      </div>
    </main>
  );
}
