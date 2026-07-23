import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { importExternalReservation } from "@/domains/channel-manager/sync";
import type { ExternalReservation } from "@/domains/channel-manager/providers/types";
import type { ChannelProviderCode } from "@/generated/prisma/client";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export const runtime = "nodejs";

/**
 * Legitimate infrastructure piece per MASTER-PLAN ("webhook handlers"), even
 * though no real channel currently calls it — none of the 6 named channels
 * expose a public self-serve webhook registration without a signed partner
 * agreement (see providers/mock-provider.ts). Shaped to accept a generic
 * reservation-notification payload so a real adapter's webhook can be wired
 * to it later; a shared secret per connection stands in for the
 * provider-specific signature scheme a real integration would verify.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const providerCode = provider.toUpperCase() as ChannelProviderCode;

  const sharedSecret = request.headers.get("x-channel-secret");
  const externalHotelId = request.headers.get("x-external-hotel-id");
  if (!sharedSecret || !externalHotelId) {
    return NextResponse.json({ error: "Missing authentication headers" }, { status: 401 });
  }

  const connection = await prisma.channelConnection.findFirst({
    where: { provider: providerCode, externalHotelId, status: "CONNECTED" },
  });
  if (!connection || !safeEqual(connection.webhookSecret, sharedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ExternalReservation;
  if (!body.externalReservationId || !body.externalRoomId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const outcome = await importExternalReservation(connection.id, body);
  return NextResponse.json({ received: true, outcome: outcome.status, conflict: outcome.conflict });
}
