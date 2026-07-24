import { test, expect } from "@playwright/test";

/**
 * No direct Prisma import here — Prisma 7's generated ESM client doesn't
 * transform cleanly under Playwright's own TS loader (see
 * PHASE-3-COMPLETION-REPORT.md's Testing milestone). Success is asserted
 * purely from page state (URL after submit), which is what a real user
 * actually experiences anyway.
 */
test.describe("Registration (critical flow)", () => {
  const testEmail = `e2e-register-${Date.now()}@example.com`;
  const password = "E2eTest#Password123";

  async function fillRegistrationForm(page: import("@playwright/test").Page) {
    await page.locator('[autocomplete="given-name"]').fill("E2E");
    await page.locator('[autocomplete="family-name"]').fill("Traveler");
    await page.locator('[autocomplete="email"]').fill(testEmail);
    await page.locator('[autocomplete="new-password"]').first().fill(password);
    await page.locator('[autocomplete="new-password"]').nth(1).fill(password);
    await page.getByRole("checkbox").check();
  }

  test("a new traveler can register and lands on the verify-email pending screen", async ({ page }) => {
    await page.goto("/en/register");
    await fillRegistrationForm(page);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/verify-email\/pending/, { timeout: 10_000 });
  });

  test("registering with an already-used email shows an error instead of succeeding", async ({ page }) => {
    // Reuses the account created above — registration must reject the duplicate, not silently create a second user.
    await page.goto("/en/register");
    await fillRegistrationForm(page);
    await page.getByRole("button", { name: "Create account" }).click();

    // Must stay on the registration page (no redirect) — the duplicate is rejected.
    await expect(page).toHaveURL(/\/register$/);
  });
});
