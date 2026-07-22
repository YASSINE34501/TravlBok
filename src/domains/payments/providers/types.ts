import type { CurrencyCode, PaymentProviderCode } from "@/generated/prisma/client";

export type PaymentIntentInput = {
  amount: number;
  currency: CurrencyCode;
  reservationId?: string;
  subscriptionId?: string;
  description: string;
  customerEmail: string;
  metadata?: Record<string, string>;
};

export type PaymentIntentResult = {
  providerReference: string;
  status: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED";
  redirectUrl?: string;
  clientSecret?: string;
  raw?: unknown;
};

export type RefundInput = {
  paymentId: string;
  providerReference: string;
  amount: number;
  reason?: string;
};

export type RefundResult = {
  providerRefundReference: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
};

export type WebhookEvent = {
  type: string;
  providerEventId: string;
  paymentProviderReference?: string;
  status?: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";
  raw: unknown;
};

export interface PaymentProvider {
  code: PaymentProviderCode;
  /** True once real credentials are configured; false means the provider runs in a clearly-labeled sandbox/mock mode. */
  isLive: boolean;
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  verifyWebhookSignature?(rawBody: string, headers: Headers): boolean;
  parseWebhookEvent?(rawBody: string, headers: Headers): Promise<WebhookEvent>;
}
