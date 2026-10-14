"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/actions/mutations";
import { ScholarLogo } from "@/components/brand/scholar-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [state, action, pending] = useActionState(async (_state: { message: string } | null, formData: FormData) => {
    const result = await loginAction(formData);
    return result ?? null;
  }, null);

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md rounded-[20px] border border-line bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <ScholarLogo className="mb-5 w-44" />
        <h1 className="text-[1.75rem] font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted">Invitation-only access for the research team. There is no public registration.</p>
        <form action={action} className="mt-6 space-y-3">
          <label className="grid gap-1.5 text-sm font-medium">Email<Input name="email" type="email" autoComplete="username" required /></label>
          <label className="grid gap-1.5 text-sm font-medium">Password<Input name="password" type="password" autoComplete="current-password" required /></label>
          {state?.message ? <p role="alert" className="text-sm text-danger">{state.message}</p> : null}
          <Button className="w-full" disabled={pending}>{pending ? "Signing in" : "Sign in"}</Button>
        </form>
      </div>
    </main>
  );
}
