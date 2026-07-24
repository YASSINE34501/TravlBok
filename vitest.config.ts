import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    // Integration tests hit the real (dev) Supabase database with
    // create-assert-cleanup scenarios — no local Postgres/Docker is
    // available in this environment (see DEPLOYMENT.md), so this mirrors
    // exactly how every milestone's manual verification worked this phase.
    // Run sequentially to avoid unrelated tests racing on the same tables.
    fileParallelism: false,
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // See tests/stubs/server-only.ts — the real package throws outside a
      // bundler that honors its "browser" package.json condition.
      "server-only": path.resolve(__dirname, "./tests/stubs/server-only.ts"),
    },
  },
});
