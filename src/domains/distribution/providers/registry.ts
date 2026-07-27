import type { DistributionVertical } from "@/generated/prisma/client";
import type { ExternalOfferProvider } from "./types";
import { createMockProvider } from "./mock-provider";

/**
 * Unlike Channel Manager's registry (always-on mock, fine for partner-facing
 * back-office tooling that's explicitly labeled "Sandbox" to the partner),
 * this is public customer-facing search — no mock/illustrative availability
 * may ever render in production. The sandbox provider only activates behind
 * an explicit opt-in env flag, unset by default, never set in production.
 * A real provider later is one new file implementing `ExternalOfferProvider`
 * plus one line here — no calling-code changes, same swap-in pattern.
 */
function isMockProviderEnabled(): boolean {
  return process.env.ENABLE_MOCK_DISTRIBUTION_PROVIDER === "true";
}

const REAL_PROVIDERS: ExternalOfferProvider[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for the per-vertical filtering a real provider will need (Phase 9); every provider today (mock or real) implements all three verticals.
export function getConfiguredProviders(_vertical: DistributionVertical): ExternalOfferProvider[] {
  if (isMockProviderEnabled()) {
    return [...REAL_PROVIDERS, createMockProvider()];
  }
  return REAL_PROVIDERS;
}

/** Lets callers distinguish "no provider configured" from "provider configured, zero matches" for an honest empty state. */
export function isDistributionConfigured(vertical: DistributionVertical): boolean {
  return getConfiguredProviders(vertical).length > 0;
}
