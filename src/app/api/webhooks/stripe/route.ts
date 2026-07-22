import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripeProvider } from "@/domains/payments/providers/stripe";
import { handlePaymentProviderEvent } from "@/domains/payments/webhook-handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Raw body is required for signature verification — never call .json() first.
  const rawBody = await request.text();
  const signatureValid = stripeProvider.verifyWebhookSignature?.(rawBody, request.headers) ?? false;

  let providerEventId: string | undefined;
  let eventType = "unknown";
  let processingError: string | null = null;

  if (signatureValid) {
    try {
      const event = await stripeProvider.parseWebhookEvent!(rawBody, request.headers);
      providerEventId = event.providerEventId;
      eventType = event.type;

      const alreadyProcessed = await prisma.webhookLog.findFirst({
        where: { provider: "STRIPE", providerEventId },
      });
      if (!alreadyProcessed) {
        await handlePaymentProviderEvent(event);
      }
    } catch (error) {
      processingError = error instanceof Error ? error.message : "Unknown error";
    }
  }

  await prisma.webhookLog.create({
    data: {
      provider: "STRIPE",
      eventType,
      providerEventId,
      payload: signatureValid ? JSON.parse(rawBody) : { note: "signature verification failed" },
      signatureValid,
      processedAt: signatureValid && !processingError ? new Date() : null,
      processingError,
    },
  });

  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  return NextResponse.json({ received: true });
}
