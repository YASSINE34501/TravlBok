import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { paypalProvider } from "@/domains/payments/providers/paypal";
import { handlePaymentProviderEvent } from "@/domains/payments/webhook-handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  let providerEventId: string | undefined;
  let eventType = "unknown";
  let signatureValid = false;
  let processingError: string | null = null;

  try {
    const event = await paypalProvider.parseWebhookEvent!(rawBody, request.headers);
    signatureValid = true;
    providerEventId = event.providerEventId;
    eventType = event.type;

    const alreadyProcessed = await prisma.webhookLog.findFirst({
      where: { provider: "PAYPAL", providerEventId },
    });
    if (!alreadyProcessed) {
      await handlePaymentProviderEvent(event);
    }
  } catch (error) {
    processingError = error instanceof Error ? error.message : "Unknown error";
  }

  await prisma.webhookLog.create({
    data: {
      provider: "PAYPAL",
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
