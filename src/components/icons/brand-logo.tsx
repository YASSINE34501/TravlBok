import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /**
   * "primary" (icon + wordmark + tagline) is for marketing pages and the
   * footer. "navbar" (icon + wordmark, no tagline) is for desktop and
   * mobile navigation — the full lockup's tagline becomes illegible at
   * navbar heights, so the navbar gets its own tighter-cropped asset
   * instead of the same file shrunk further.
   */
  variant?: "primary" | "navbar";
};

const SOURCES = {
  primary: { light: "/brand/travlbok-logo.svg", dark: "/brand/travlbok-logo-dark.svg" },
  navbar: { light: "/brand/travlbok-navbar-logo.svg", dark: "/brand/travlbok-navbar-logo-dark.svg" },
} as const;

/**
 * Official TravlBok logo lockup, a tightly-cropped vector — a plain <img>
 * is deliberate here over next/image: SVG logos gain nothing from the
 * raster image optimizer, and this avoids needing `dangerouslyAllowSVG`
 * in next.config.
 *
 * Two source files per variant, toggled by Tailwind's `dark:` variant
 * (CSS-only, no theme hook needed — stays a server component): the
 * wordmark and tagline are set in dark ink for light backgrounds, which
 * is illegible against the dark-mode navy background, so the dark variant
 * swaps that ink text for a light cream while keeping the gold "Bok"/mark
 * unchanged in both.
 */
export function BrandLogo({ className, variant = "primary" }: Props) {
  const { light, dark } = SOURCES[variant];
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={light}
        alt="TravlBok"
        className={cn("h-auto w-auto object-contain dark:hidden", className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dark}
        alt="TravlBok"
        className={cn("hidden h-auto w-auto object-contain dark:block", className)}
      />
    </>
  );
}
