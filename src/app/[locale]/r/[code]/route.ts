import { createHash, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { AFFILIATE_REF_COOKIE } from "@/domains/affiliates/conversion";

export const runtime = "nodejs";

const VISITOR_COOKIE = "TRAVLBOK_VISITOR";
const REF_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days, last-click attribution
const CLICK_DEDUP_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Referral link entry point (e.g. travlbok.com/en/r/AB12CD34?camp=summer).
 * Not implemented as searchParams-sniffing in the shared locale layout —
 * Next.js layouts don't receive `searchParams`, only pages/route handlers
 * do — so this is a dedicated redirect route instead, the standard pattern
 * for referral links. Runs on the Node runtime so it can use Prisma
 * directly (this route is not on the Edge-only proxy.ts path).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; code: string }> }
) {
  const { locale, code } = await params;
  const campaignSlug = request.nextUrl.searchParams.get("camp") ?? undefined;
  const destination = request.nextUrl.searchParams.get("to") || `/${locale}`;

  const affiliate = await prisma.affiliate.findUnique({ where: { referralCode: code } });
  const response = NextResponse.redirect(new URL(destination, request.url));

  if (!affiliate) {
    return response;
  }

  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  if (!visitorId) {
    visitorId = randomUUID();
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      maxAge: 365 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  const campaign = campaignSlug
    ? await prisma.campaign.findUnique({
        where: { affiliateId_slug: { affiliateId: affiliate.id, slug: campaignSlug } },
      })
    : null;

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipAddressHash = createHash("sha256").update(ipAddress).digest("hex");

  const recentClick = await prisma.affiliateClick.findFirst({
    where: {
      affiliateId: affiliate.id,
      visitorId,
      createdAt: { gte: new Date(Date.now() - CLICK_DEDUP_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
  });

  const click =
    recentClick ??
    (await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        campaignId: campaign?.id,
        visitorId,
        ipAddressHash,
        userAgent: request.headers.get("user-agent") ?? undefined,
        landingPath: destination,
      },
    }));

  response.cookies.set(
    AFFILIATE_REF_COOKIE,
    JSON.stringify({ affiliateId: affiliate.id, campaignId: campaign?.id, clickId: click.id }),
    { maxAge: REF_COOKIE_MAX_AGE_SECONDS, httpOnly: true, sameSite: "lax" }
  );

  return response;
}
