import type { ChannelProviderCode } from "@/generated/prisma/client";

export type ChannelCredentials = {
  apiKey?: string;
  apiSecret?: string;
  hotelId?: string;
  endpoint?: string;
  [key: string]: string | undefined;
};

export type RoomAvailabilityRateInput = {
  externalRoomId: string;
  externalRatePlanId?: string | null;
  date: string; // YYYY-MM-DD
  availableCount: number;
  price: number;
  currency: string;
};

export type RoomRestrictionInput = {
  externalRoomId: string;
  externalRatePlanId?: string | null;
  date: string;
  minStay?: number;
  maxStay?: number;
  closed: boolean;
};

export type ExternalReservation = {
  externalReservationId: string;
  externalRoomId: string;
  checkInDate: string;
  checkOutDate: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;
  totalAmount: number;
  currency: string;
  status: "CONFIRMED" | "CANCELLED";
  raw: unknown;
};

export type ChannelOperationResult = {
  success: boolean;
  itemsProcessed: number;
  itemsFailed: number;
  errorMessage?: string;
  details?: Array<{ level: "INFO" | "WARN" | "ERROR"; message: string; metadata?: unknown }>;
};

export interface ChannelProvider {
  code: ChannelProviderCode;
  displayName: string;
  /** True once real partner credentials + an official API contract exist for this provider — always false today (see schema comment on ChannelConnection). */
  isLive: boolean;

  testConnection(credentials: ChannelCredentials): Promise<{ success: boolean; message: string }>;
  pushAvailability(
    credentials: ChannelCredentials,
    rows: RoomAvailabilityRateInput[]
  ): Promise<ChannelOperationResult>;
  pushRates(
    credentials: ChannelCredentials,
    rows: RoomAvailabilityRateInput[]
  ): Promise<ChannelOperationResult>;
  pushRestrictions(
    credentials: ChannelCredentials,
    rows: RoomRestrictionInput[]
  ): Promise<ChannelOperationResult>;
  pullReservations(
    credentials: ChannelCredentials,
    since: Date
  ): Promise<{ reservations: ExternalReservation[] } & ChannelOperationResult>;
  pushCancellation(
    credentials: ChannelCredentials,
    externalReservationId: string
  ): Promise<ChannelOperationResult>;
}
