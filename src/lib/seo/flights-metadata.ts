import type { Metadata } from "next";
import { buildLocaleAlternates } from "./alternates";

/**
 * Shared `generateMetadata` builder for the Flights content pages
 * (destination/route/deals/airline/offer-detail). Follows the same shape
 * already used by `flights/page.tsx` and the hotel detail page — those
 * don't hand-roll per-page Open Graph/Twitter blocks, relying instead on
 * the root `[locale]/layout.tsx`'s site-wide defaults (Next.js metadata
 * merging fills in `openGraph`/`twitter` from there when a page doesn't
 * declare its own). `robots.index` is the one field those existing pages
 * don't yet use — this is the first place in the app that sets it,
 * introduced here because these are the first pages whose indexability
 * genuinely varies per instance (a destination with real fares vs. one
 * without).
 */
export function buildFlightsPageMetadata({
  locale,
  path,
  title,
  description,
  index,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  index: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: buildLocaleAlternates(locale, path),
    robots: { index, follow: true },
  };
}
