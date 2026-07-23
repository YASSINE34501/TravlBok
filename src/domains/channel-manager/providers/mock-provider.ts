import type {
  ChannelProvider,
  ChannelCredentials,
  RoomAvailabilityRateInput,
  RoomRestrictionInput,
  ChannelOperationResult,
  ExternalReservation,
} from "./types";
import type { ChannelProviderCode } from "@/generated/prisma/client";

const DISPLAY_NAMES: Record<ChannelProviderCode, string> = {
  BOOKING_COM: "Booking.com",
  EXPEDIA: "Expedia",
  AIRBNB: "Airbnb",
  AGODA: "Agoda",
  HOTELS_COM: "Hotels.com",
  VRBO: "Vrbo",
  MOCK_SANDBOX: "Sandbox (testing)",
};

/**
 * None of Booking.com/Expedia/Airbnb/Agoda/Hotels.com/Vrbo expose a public
 * self-serve API — connecting one for real requires a signed partner
 * agreement and their official SDK/API contract, which does not exist for
 * this project. Per MASTER-PLAN: "Do not create fake production
 * integrations... Actual API connections enabled only with official
 * partner credentials." This adapter is the honest alternative: it
 * implements the full ChannelProvider interface, validates and simulates
 * every operation locally (no network calls, deterministic success unless
 * credentials are obviously incomplete), and logs realistically — so the
 * whole sync pipeline (mapping, push, pull, conflict detection, retries)
 * is exercised end-to-end. Swapping in a real adapter later (once a
 * partner agreement + official docs exist) means implementing this same
 * interface and changing one line in registry.ts — no calling code changes.
 */
export function createMockProvider(code: ChannelProviderCode): ChannelProvider {
  return {
    code,
    displayName: DISPLAY_NAMES[code],
    isLive: false,

    async testConnection(credentials: ChannelCredentials) {
      if (!credentials.apiKey) {
        return { success: false, message: "Missing API key" };
      }
      return {
        success: true,
        message: `Sandbox connection to ${DISPLAY_NAMES[code]} verified (simulated — no live credentials configured).`,
      };
    },

    async pushAvailability(
      _credentials: ChannelCredentials,
      rows: RoomAvailabilityRateInput[]
    ): Promise<ChannelOperationResult> {
      return {
        success: true,
        itemsProcessed: rows.length,
        itemsFailed: 0,
        details: [
          {
            level: "INFO",
            message: `Simulated availability push of ${rows.length} row(s) to ${DISPLAY_NAMES[code]}.`,
          },
        ],
      };
    },

    async pushRates(
      _credentials: ChannelCredentials,
      rows: RoomAvailabilityRateInput[]
    ): Promise<ChannelOperationResult> {
      return {
        success: true,
        itemsProcessed: rows.length,
        itemsFailed: 0,
        details: [
          {
            level: "INFO",
            message: `Simulated rate push of ${rows.length} row(s) to ${DISPLAY_NAMES[code]}.`,
          },
        ],
      };
    },

    async pushRestrictions(
      _credentials: ChannelCredentials,
      rows: RoomRestrictionInput[]
    ): Promise<ChannelOperationResult> {
      return {
        success: true,
        itemsProcessed: rows.length,
        itemsFailed: 0,
        details: [
          {
            level: "INFO",
            message: `Simulated restriction push of ${rows.length} row(s) to ${DISPLAY_NAMES[code]}.`,
          },
        ],
      };
    },

    async pullReservations() {
      // No real channel is connected, so there is nothing to pull.
      // Reservations are imported in this sandbox via the explicit
      // "simulate incoming reservation" action instead (see actions.ts) —
      // real inbound bookings would normally arrive here or via webhook.
      const reservations: ExternalReservation[] = [];
      return {
        success: true,
        itemsProcessed: 0,
        itemsFailed: 0,
        reservations,
        details: [
          {
            level: "INFO",
            message: `No live connection to ${DISPLAY_NAMES[code]} — nothing to pull. Use "Simulate incoming reservation" to test the import pipeline.`,
          },
        ],
      };
    },

    async pushCancellation(
      _credentials: ChannelCredentials,
      externalReservationId: string
    ): Promise<ChannelOperationResult> {
      return {
        success: true,
        itemsProcessed: 1,
        itemsFailed: 0,
        details: [
          {
            level: "INFO",
            message: `Simulated cancellation notice sent to ${DISPLAY_NAMES[code]} for ${externalReservationId}.`,
          },
        ],
      };
    },
  };
}
