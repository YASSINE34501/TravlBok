import type { ChannelProviderCode } from "@/generated/prisma/client";
import type { ChannelProvider } from "./types";
import { createMockProvider } from "./mock-provider";

const PROVIDER_CODES: ChannelProviderCode[] = [
  "BOOKING_COM",
  "EXPEDIA",
  "AIRBNB",
  "AGODA",
  "HOTELS_COM",
  "VRBO",
  "MOCK_SANDBOX",
];

const providers: Record<ChannelProviderCode, ChannelProvider> = Object.fromEntries(
  PROVIDER_CODES.map((code) => [code, createMockProvider(code)])
) as Record<ChannelProviderCode, ChannelProvider>;

export function getChannelProvider(code: ChannelProviderCode): ChannelProvider {
  return providers[code];
}

export function listChannelProviders(): ChannelProvider[] {
  return PROVIDER_CODES.map((code) => providers[code]);
}
