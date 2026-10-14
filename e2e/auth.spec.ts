import { expect, test } from "@playwright/test";

test("unauthenticated visitors are sent to sign in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("login does not offer public registration", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: /create account|sign up|register/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /create account|sign up|^register$/i })).toHaveCount(0);
});

test("a bad invitation cannot be used", async ({ page }) => {
  await page.goto("/invite/not-a-real-token");
  await expect(page.getByText(/not valid|expired|revoked|already used|could not/i)).toBeVisible();
});
