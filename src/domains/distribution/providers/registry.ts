import type { DistributionVertical } from "@/generated/prisma/client";
import type { ExternalOfferProvider } from "./types";
import { createMockProvider } from "./mock-provider";
import { createAviasalesProvider } from "./aviasales-provider";
import { isTravelpayoutsConfigured } from "@/lib/env";

/**
 * Unlike Channel Manager's registry (always-on mock, fine for partner-facing
 * back-office tooling that's explicitly labeled "Sandbox" to the partner),
 * this is public customer-facing search — no mock/illustrative availability
 * may ever render in production. The sandbox provider only activates behind
 * an explicit opt-in env flag, unset by default, never set in production.
 */
function isMockProviderEnabled(): boolean {
  // Hard override, not just a documented convention: a leaked/misconfigured
  // env flag must never be able to fabricate offers in front of real
  // customers, regardless of what ENABLE_MOCK_DISTRIBUTION_PROVIDER says.
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ENABLE_MOCK_DISTRIBUTION_PROVIDER === "true";
}

/** Real providers, included only once their required credentials are actually present. */
function getRealProviders(vertical: DistributionVertical): ExternalOfferProvider[] {
  const providers: ExternalOfferProvider[] = [];
  if (vertical === "FLIGHT" && isTravelpayoutsConfigured()) {
    providers.push(createAviasalesProvider());
  }
  return providers;
}

export function getConfiguredProviders(vertical: DistributionVertical): ExternalOfferProvider[] {
  const providers = getRealProviders(vertical);
  if (isMockProviderEnabled()) {
    return [...providers, createMockProvider()];
  }
  return providers;
}

/** Lets callers distinguish "no provider configured" from "provider configured, zero matches" for an honest empty state. */
export function isDistributionConfigured(vertical: DistributionVertical): boolean {
  return getConfiguredProviders(vertical).length > 0;
}
