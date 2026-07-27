import type { SourceType } from "@/generated/prisma/client";

export type CheckoutMode = "INTERNAL_CHECKOUT" | "EXTERNAL_REDIRECT" | "EXTERNAL_WIDGET";

/**
 * `sourceType` is internal bookkeeping only — never rendered as UI copy.
 * This is the single place that decides what clicking an offer actually
 * does; AFFILIATE_REDIRECT and AFFILIATE_WHITE_LABEL share one code path
 * today (both just leave TravlBok for a provider-hosted page).
 */
export function getCheckoutMode(sourceType: SourceType): CheckoutMode {
  switch (sourceType) {
    case "DIRECT_TRAVLBOK":
      return "INTERNAL_CHECKOUT";
    case "AFFILIATE_WIDGET":
      return "EXTERNAL_WIDGET";
    case "AFFILIATE_REDIRECT":
    case "AFFILIATE_WHITE_LABEL":
    default:
      return "EXTERNAL_REDIRECT";
  }
}

/** Builds the `/[locale]/go/[vertical]` tracked redirect href for an external offer. */
export function buildGoHref(params: {
  locale: string;
  vertical: "hotel" | "car" | "flight";
  provider: string;
  offerId: string;
  url: string;
  sourceType: SourceType;
}): string {
  const search = new URLSearchParams({
    provider: params.provider,
    offerId: params.offerId,
    url: params.url,
    sourceType: params.sourceType,
  });
  return `/${params.locale}/go/${params.vertical}?${search.toString()}`;
}
