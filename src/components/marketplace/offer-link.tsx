import { Link } from "@/i18n/navigation";
import type { CheckoutMode } from "@/domains/distribution/checkout-mode";

/**
 * Wraps a result card in either an internal `Link` (DIRECT_TRAVLBOK — stays
 * on TravlBok) or a plain external `<a>` (externally-sourced offers — the
 * `/go/[vertical]` route logs a click then redirects out). Renders
 * identically either way — `checkoutMode` only changes the click target,
 * never the appearance, per the "one seamless platform" requirement.
 */
export function OfferLink({
  checkoutMode,
  internalHref,
  externalHref,
  className,
  children,
}: {
  checkoutMode: CheckoutMode;
  internalHref?: string;
  externalHref?: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (checkoutMode === "EXTERNAL_REDIRECT" && externalHref) {
    return (
      <a href={externalHref} className={className} rel="sponsored noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={internalHref ?? "#"} className={className}>
      {children}
    </Link>
  );
}
