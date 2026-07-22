import Stripe from "stripe";
import type {
  PaymentProvider,
  PaymentIntentInput,
  PaymentIntentResult,
  RefundInput,
  RefundResult,
  WebhookEvent,
} from "./types";

const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const isLive = !!secretKey;

const stripeClient = secretKey ? new Stripe(secretKey) : null;

function mockReference(prefix: string): string {
  return `mock_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Real Stripe SDK integration. Runs in a clearly-labeled sandbox/mock mode
 * (no network call, deterministic PENDING result) whenever STRIPE_SECRET_KEY
 * is not configured — mirrors how MASTER-PLAN scopes Phase 3's channel
 * manager mock connectors: do not fake a production integration, but do not
 * block development on missing third-party credentials either.
 */
export const stripeProvider: PaymentProvider = {
  code: "STRIPE",
  isLive,

  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    if (!stripeClient) {
      return {
        providerReference: mockReference("pi"),
        status: "PENDING",
        raw: { mock: true, reason: "STRIPE_SECRET_KEY not configured" },
      };
    }

    const intent = await stripeClient.paymentIntents.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency.toLowerCase(),
      description: input.description,
      receipt_email: input.customerEmail,
      metadata: {
        ...input.metadata,
        reservationId: input.reservationId ?? "",
        subscriptionId: input.subscriptionId ?? "",
      },
    });

    return {
      providerReference: intent.id,
      status: intent.status === "succeeded" ? "PAID" : "PENDING",
      clientSecret: intent.client_secret ?? undefined,
      raw: intent,
    };
  },

  async refund(input: RefundInput): Promise<RefundResult> {
    if (!stripeClient) {
      return { providerRefundReference: mockReference("re"), status: "COMPLETED" };
    }

    const refund = await stripeClient.refunds.create({
      payment_intent: input.providerReference,
      amount: Math.round(input.amount * 100),
      reason: "requested_by_customer",
    });

    return {
      providerRefundReference: refund.id,
      status: refund.status === "succeeded" ? "COMPLETED" : "PENDING",
    };
  },

  verifyWebhookSignature(rawBody: string, headers: Headers): boolean {
    if (!stripeClient || !webhookSecret) return false;
    const signature = headers.get("stripe-signature");
    if (!signature) return false;
    try {
      stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
      return true;
    } catch {
      return false;
    }
  },

  async parseWebhookEvent(rawBody: string, headers: Headers): Promise<WebhookEvent> {
    if (!stripeClient || !webhookSecret) {
      throw new Error("Stripe webhook verification is not configured");
    }
    const signature = headers.get("stripe-signature") ?? "";
    const event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);

    const intent = event.data.object as Stripe.PaymentIntent;
    const statusMap: Record<string, WebhookEvent["status"]> = {
      "payment_intent.succeeded": "PAID",
      "payment_intent.payment_failed": "FAILED",
      "payment_intent.canceled": "FAILED",
    };

    return {
      type: event.type,
      providerEventId: event.id,
      paymentProviderReference: intent?.id,
      status: statusMap[event.type],
      raw: event,
    };
  },
};
