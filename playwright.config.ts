import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests for MASTER-PLAN's critical flows (Registration, Bookings, PMS
 * check-in/out — Approvals is admin-action-only and already covered by the
 * Vitest integration suite's real-DB tests, not duplicated here). Runs
 * against `npm run dev`/`npm run start` on localhost:3000 — `webServer`
 * below starts it automatically if nothing is already listening there.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // One worker: these tests share the same dev server (Turbopack's
  // on-demand per-route compile can be slow on a cold hit) and hit real
  // shared state (login rate limiting, seeded data) — running one at a time
  // avoids contention that looks like a UI bug but isn't.
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  // Generous default: Turbopack compiles each route on first hit in dev,
  // which can take several seconds longer than Playwright's 5s default.
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/en",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
