"use server";

import { isNextRedirect } from "@/lib/errors";
import { signIn, signOut } from "@/server/auth";

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      remember: formData.get("remember") === "on" ? "true" : "false",
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
    if (code.includes("rate")) return { ok: false as const, message: "Too many attempts. Wait a few minutes and try again." };
    if (code.includes("database")) return { ok: false as const, message: "Sign-in could not reach the database. Try again in a moment." };
    return { ok: false as const, message: "Email or password is incorrect." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
