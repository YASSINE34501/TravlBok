import type {
  PaymentProvider,
  PaymentIntentInput,
  PaymentIntentResult,
  RefundInput,
  RefundResult,
  WebhookEvent,
} from "./types";

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const isLive = !!(clientId && clientSecret);

// PayPal's official Node SDK is deprecated in favor of calling the REST API
// directly — this is a thin fetch-based client over the v2 Orders API.
const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";

function mockReference(prefix: string): string {
  return `mock_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function getAccessToken(): Promise<string> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error("Failed to obtain PayPal access token");
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export const paypalProvider: PaymentProvider = {
  code: "PAYPAL",
  isLive,

  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    if (!isLive) {
      return {
        providerReference: mockReference("order"),
        status: "PENDING",
        raw: { mock: true, reason: "PAYPAL_CLIENT_ID/SECRET not configured" },
      };
    }

    const accessToken = await getAccessToken();
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: input.currency, value: input.amount.toFixed(2) },
            description: input.description,
          },
        ],
      }),
    });
    if (!response.ok) {
      return { providerReference: "", status: "FAILED", raw: await response.text() };
    }
    const order = (await response.json()) as {
      id: string;
      status: string;
      links: { rel: string; href: string }[];
    };
    const approveLink = order.links.find((l) => l.rel === "approve")?.href;

    return {
      providerReference: order.id,
      status: order.status === "COMPLETED" ? "PAID" : "PENDING",
      redirectUrl: approveLink,
      raw: order,
    };
  },

  async refund(input: RefundInput): Promise<RefundResult> {
    if (!isLive) {
      return { providerRefundReference: mockReference("refund"), status: "COMPLETED" };
    }

    const accessToken = await getAccessToken();
    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/payments/captures/${input.providerReference}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: { value: input.amount.toFixed(2), currency_code: "USD" } }),
      }
    );
    const data = (await response.json()) as { id: string; status: string };
    return {
      providerRefundReference: data.id,
      status: data.status === "COMPLETED" ? "COMPLETED" : "PENDING",
    };
  },

  verifyWebhookSignature(): boolean {
    // PayPal webhook verification requires a server-to-server call to
    // /v1/notifications/verify-webhook-signature with the full header set;
    // implemented in parseWebhookEvent where the headers are available.
    return isLive;
  },

  async parseWebhookEvent(rawBody: string, headers: Headers): Promise<WebhookEvent> {
    if (!isLive || !process.env.PAYPAL_WEBHOOK_ID) {
      throw new Error("PayPal webhook verification is not configured");
    }
    const accessToken = await getAccessToken();
    const event = JSON.parse(rawBody) as { id: string; event_type: string; resource: { id: string } };

    const verifyResponse = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: headers.get("paypal-auth-algo"),
          cert_url: headers.get("paypal-cert-url"),
          transmission_id: headers.get("paypal-transmission-id"),
          transmission_sig: headers.get("paypal-transmission-sig"),
          transmission_time: headers.get("paypal-transmission-time"),
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: event,
        }),
      }
    );
    const verification = (await verifyResponse.json()) as { verification_status: string };
    if (verification.verification_status !== "SUCCESS") {
      throw new Error("Invalid PayPal webhook signature");
    }

    const statusMap: Record<string, WebhookEvent["status"]> = {
      "PAYMENT.CAPTURE.COMPLETED": "PAID",
      "PAYMENT.CAPTURE.DENIED": "FAILED",
      "PAYMENT.CAPTURE.REFUNDED": "REFUNDED",
    };

    return {
      type: event.event_type,
      providerEventId: event.id,
      paymentProviderReference: event.resource?.id,
      status: statusMap[event.event_type],
      raw: event,
    };
  },
};
