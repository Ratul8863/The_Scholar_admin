"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { loginAction } from "@/server/actions/session";
import { ScholarLogo } from "@/components/brand/scholar-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function PasswordField() {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input id="password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" required className="pe-16" />
      <button
        type="button"
        className="absolute top-1/2 end-2 h-8 -translate-y-1/2 rounded-full px-2.5 text-xs text-ink hover:bg-[var(--chip-hover)]"
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(async (_state: { message: string } | null, formData: FormData) => {
    const result = await loginAction(formData);
    return result ?? null;
  }, null);

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10 sm:px-6">
      <div className="warm-sheet w-full max-w-md">
        <ScholarLogo className="mb-5 w-44" />
        <h1 className="page-title">Sign in</h1>
        <p className="type-16 mt-2 text-muted">Invitation-only access for the research team. There is no public registration.</p>
        <form action={action} className="mt-6 space-y-3">
          <label className="grid gap-1.5 text-sm font-medium">Email<Input name="email" type="email" autoComplete="username" required /></label>
          <div className="grid gap-1.5 text-sm font-medium"><label htmlFor="password">Password</label><PasswordField /></div>
          <label className="flex w-fit cursor-pointer items-center gap-2 py-1 text-sm font-medium text-ink">
            <span className="grid h-[18px] w-[18px] place-items-center">
              <input
                type="checkbox"
                name="remember"
                className="peer col-start-1 row-start-1 h-[18px] w-[18px] cursor-pointer appearance-none rounded-[5px] border border-line-strong bg-white transition-colors duration-[180ms] checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
              <Check className="pointer-events-none col-start-1 row-start-1 h-3 w-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
            </span>
            Remember me
          </label>
          {state?.message ? <p role="alert" className="text-sm text-danger">{state.message}</p> : null}
          <Button className="w-full" disabled={pending}>{pending ? "Signing in" : "Sign in"}</Button>
        </form>
      </div>
    </main>
  );
}
