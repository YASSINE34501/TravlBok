import type {
  BookingStatus,
  PaymentStatus,
  PropertyStatus,
  PaymentTransactionStatus,
  SubscriptionStatus,
  VehicleStatus,
  ChannelConnectionStatus,
  WithdrawalStatus,
  SyncJobStatus,
} from "@/generated/prisma/client";
import type { StatusTone } from "@/components/ui/status-badge";

export const RESERVATION_STATUS_TONE: Record<BookingStatus, StatusTone> = {
  DRAFT: "neutral",
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "destructive",
  COMPLETED: "success",
  NO_SHOW: "destructive",
  REFUNDED: "neutral",
  PARTIALLY_REFUNDED: "neutral",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, StatusTone> = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "destructive",
};

export const PROPERTY_STATUS_TONE: Record<PropertyStatus, StatusTone> = {
  DRAFT: "neutral",
  PENDING_REVIEW: "warning",
  CHANGES_REQUESTED: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  SUSPENDED: "destructive",
  PUBLISHED: "success",
  UNPUBLISHED: "neutral",
};

export const PAYMENT_TRANSACTION_STATUS_TONE: Record<PaymentTransactionStatus, StatusTone> = {
  PENDING: "warning",
  AUTHORIZED: "info",
  PAID: "success",
  FAILED: "destructive",
  CANCELLED: "neutral",
  REFUNDED: "neutral",
  PARTIALLY_REFUNDED: "neutral",
};

export const SUBSCRIPTION_STATUS_TONE: Record<SubscriptionStatus, StatusTone> = {
  TRIALING: "info",
  ACTIVE: "success",
  PAST_DUE: "warning",
  GRACE_PERIOD: "warning",
  SUSPENDED: "destructive",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
};

export const VEHICLE_STATUS_TONE: Record<VehicleStatus, StatusTone> = {
  AVAILABLE: "success",
  RESERVED: "info",
  RENTED: "info",
  MAINTENANCE: "warning",
  INACTIVE: "neutral",
};

export const CHANNEL_CONNECTION_STATUS_TONE: Record<ChannelConnectionStatus, StatusTone> = {
  CONNECTED: "success",
  ERROR: "destructive",
  DISCONNECTED: "neutral",
};

export const WITHDRAWAL_STATUS_TONE: Record<WithdrawalStatus, StatusTone> = {
  REQUESTED: "warning",
  APPROVED: "info",
  REJECTED: "destructive",
  PAID: "success",
};

export const SYNC_JOB_STATUS_TONE: Record<SyncJobStatus, StatusTone> = {
  PENDING: "neutral",
  PROCESSING: "info",
  COMPLETED: "success",
  FAILED: "destructive",
  PARTIAL: "warning",
  CONFLICT: "destructive",
};
