import { createHash, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resolveSafeExternalRedirect } from "@/lib/affiliate/urls";
import type { DistributionVertical, DistributionProviderCode, SourceType } from "@/generated/prisma/client";

export const runtime = "nodejs";

const VISITOR_COOKIE = "TRAVLBOK_VISITOR";
const VALID_VERTICALS: DistributionVertical[] = ["HOTEL", "CAR", "FLIGHT"];
const VALID_PROVIDERS: DistributionProviderCode[] = ["MOCK_SANDBOX", "AVIASALES"];
const VALID_SOURCE_TYPES: SourceType[] = [
  "DIRECT_TRAVLBOK",
  "AFFILIATE_REDIRECT",
  "AFFILIATE_WHITE_LABEL",
  "AFFILIATE_WIDGET",
];

/**
 * Redirect entry point for externally-sourced offers (e.g.
 * travlbok.com/en/go/flight?provider=MOCK_SANDBOX&offerId=x&url=<encoded>).
 * Mirrors `src/app/[locale]/r/[code]/route.ts`'s mechanics (visitor cookie,
 * hashed IP, click log) for a deliberately separate concept — this logs a
 * `DistributionClick` (consuming external providers), never an
 * `AffiliateClick` (TravlBok's own outbound referral program). Never
 * touches `Reservation` — affiliate offers can only ever produce a click
 * record here, the purchase itself completes on the provider's site.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; vertical: string }> }
) {
  const { locale, vertical: verticalParam } = await params;
  const vertical = verticalParam.toUpperCase() as DistributionVertical;
  const providerParam = (request.nextUrl.searchParams.get("provider") ?? "").toUpperCase();
  const provider = (
    VALID_PROVIDERS.includes(providerParam as DistributionProviderCode)
      ? providerParam
      : "MOCK_SANDBOX"
  ) as DistributionProviderCode;
  const offerId = request.nextUrl.searchParams.get("offerId") ?? "unknown";
  const targetUrl = request.nextUrl.searchParams.get("url");

  if (!VALID_VERTICALS.includes(vertical)) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // Protocol-allowlisted (http/https only) — deliberately not host-restricted,
  // since sending visitors to third-party provider domains not known in
  // advance is this route's whole purpose. Blocks `javascript:`/`data:`/etc.
  // from ever reaching a Location header. See src/lib/affiliate/validation.ts.
  const destination = resolveSafeExternalRedirect(targetUrl);
  if (!destination) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  const response = NextResponse.redirect(destination);

  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  if (!visitorId) {
    visitorId = randomUUID();
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      maxAge: 365 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipAddressHash = createHash("sha256").update(ipAddress).digest("hex");
  const sourceTypeParam = (request.nextUrl.searchParams.get("sourceType") ?? "").toUpperCase();
  const sourceType: SourceType = VALID_SOURCE_TYPES.includes(sourceTypeParam as SourceType)
    ? (sourceTypeParam as SourceType)
    : "AFFILIATE_REDIRECT";

  await prisma.distributionClick.create({
    data: {
      vertical,
      provider,
      sourceType,
      externalOfferId: offerId,
      visitorId,
      ipAddressHash,
      userAgent: request.headers.get("user-agent") ?? undefined,
      landingPath: request.nextUrl.pathname + request.nextUrl.search,
      redirectUrl: destination.toString(),
    },
  });

  return response;
}
