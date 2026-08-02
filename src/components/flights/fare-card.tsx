import { Plane } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";

/**
 * The compact "route/destination → price" card pattern (originally
 * duplicated 3× inline in `flights-landing.tsx`) — reused by the new
 * destination/route/deals content pages. `flights-landing.tsx` itself keeps
 * its own already-approved inline markup untouched.
 */
export function FareCard({
  href,
  originCode,
  destinationCode,
  title,
  priceLabel,
  subtitle,
  badgeLabel,
  badgeVariant = "secondary",
}: {
  href: string;
  originCode?: string;
  destinationCode?: string;
  title: string;
  priceLabel: string;
  subtitle?: string;
  badgeLabel?: string;
  badgeVariant?: "secondary" | "success" | "warning";
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/20"
    >
      <div className="flex items-center justify-between gap-2">
        {originCode && destinationCode ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{originCode}</span>
            <Plane className="size-3.5 rtl:-scale-x-100" />
            <span className="font-semibold text-foreground">{destinationCode}</span>
          </div>
        ) : (
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        )}
        {badgeLabel && (
          <Badge variant={badgeVariant} className="shrink-0 text-[10px]">
            {badgeLabel}
          </Badge>
        )}
      </div>
      {originCode && destinationCode && (
        <p className="mt-1 truncate text-sm text-muted-foreground">{title}</p>
      )}
      <p className="mt-3 text-lg font-semibold text-primary">{priceLabel}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </Link>
  );
}
