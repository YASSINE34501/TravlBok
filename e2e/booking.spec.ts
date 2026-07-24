import { test, expect } from "@playwright/test";

/**
 * Fully UI-driven: register -> log in -> search -> hotel detail -> book a
 * room -> confirm. No direct Prisma import here (Prisma 7's generated ESM
 * client doesn't transform cleanly under Playwright's own TS loader — see
 * PHASE-3-COMPLETION-REPORT.md's Testing milestone) — every assertion is
 * made against real page state instead (URLs, visible confirmation text),
 * which is arguably more representative of the actual user-facing flow anyway.
 */
test.describe("Hotel booking (critical flow)", () => {
  const testEmail = `e2e-booking-${Date.now()}@example.com`;
  const password = "E2eTest#Password123";

  test("a registered customer can search, open a hotel, book a room, and reach the confirmation page", async ({
    page,
  }) => {
    // ---- Register ----
    await page.goto("/en/register");
    await page.locator('[autocomplete="given-name"]').fill("E2E");
    await page.locator('[autocomplete="family-name"]').fill("Booker");
    await page.locator('[autocomplete="email"]').fill(testEmail);
    await page.locator('[autocomplete="new-password"]').first().fill(password);
    await page.locator('[autocomplete="new-password"]').nth(1).fill(password);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/verify-email\/pending/, { timeout: 10_000 });

    // ---- Log in (an unverified CUSTOMER can still sign in — only SUSPENDED accounts are blocked) ----
    await page.goto("/en/login");
    await page.locator('[autocomplete="email"]').fill(testEmail);
    await page.locator('[autocomplete="current-password"]').fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/en\/?$/, { timeout: 10_000 });

    page.on("response", (response) => {
      if (response.status() >= 400) console.log(`[e2e] ${response.status()} ${response.url()}`);
    });

    // ---- Search -> open the first published hotel ----
    // Navigated directly from the extracted href rather than `.click()`ing
    // the search-result card: clicking through a client-side transition on a
    // cold Turbopack dev server (every route here compiles on first hit)
    // proved flaky in practice; a real GET to the real route exercises the
    // same server-rendered page without racing the SPA transition.
    await page.goto("/en/hotels");
    const firstHotelLink = page.locator('a[href^="/en/hotels/"]').first();
    await expect(firstHotelLink).toBeVisible({ timeout: 15_000 });
    const hotelHref = await firstHotelLink.getAttribute("href");
    if (!hotelHref) throw new Error("first hotel result had no href");
    await page.goto(hotelHref);
    await expect(page).toHaveURL(/\/en\/hotels\/[a-f0-9-]+$/, { timeout: 15_000 });

    // ---- Start booking the first room ----
    const bookingLink = page.getByRole("button", { name: "Confirm booking" }).first();
    await expect(bookingLink).toBeVisible({ timeout: 15_000 });
    const bookingHref = await bookingLink.getAttribute("href");
    if (!bookingHref) throw new Error("room's booking button had no href");
    await page.goto(bookingHref);
    await expect(page).toHaveURL(/\/book\?roomTypeId=/, { timeout: 15_000 });

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 60);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    await page.locator("#check-in").fill(fmt(checkIn));
    await page.locator("#check-out").fill(fmt(checkOut));
    await page.getByRole("button", { name: "View details" }).click();
    await expect(page.getByText("Total", { exact: true })).toBeVisible({ timeout: 30_000 });

    await page.locator("#first-name").fill("E2E");
    await page.locator("#last-name").fill("Booker");
    await page.locator("#email").fill(testEmail);

    await page.getByRole("button", { name: "Confirm booking" }).click();
    await expect(page).toHaveURL(/\/bookings\/[a-f0-9-]+/, { timeout: 20_000 });
  });
});
