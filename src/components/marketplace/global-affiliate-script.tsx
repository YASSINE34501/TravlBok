import Script from "next/script";

// Travelpayouts Drive — project-specific global monetization script.
// Do not reuse this script for another domain or Travelpayouts Project.
//
// Mounted once, site-wide, in the true root App Router layout
// (`src/app/[locale]/layout.tsx` renders <html>/<body> directly — there is
// no separate non-localized root layout above it). `id` gives next/script
// its own dedup (it tracks injected script ids across client-side
// navigation and never re-inserts one already present), so this stays
// safe even though the root layout re-renders on every locale-prefixed
// route. The vendor-required attributes below (`data-noptimize`,
// `data-cfasync`, `data-wpfc-render`, `seraph-accel-crit`, `data-no-defer`)
// aren't part of React's typed script props, so they're passed through an
// untyped spread rather than dropped.
const DRIVE_SCRIPT_URL = "https://emrldtp.com/NTU0NTk0.js?t=554594";

const DRIVE_VENDOR_ATTRS = {
  "data-noptimize": "1",
  "data-cfasync": "false",
  "data-wpfc-render": "false",
  "seraph-accel-crit": "1",
  "data-no-defer": "1",
} as Record<string, string>;

export function GlobalAffiliateScript() {
  return (
    // False positive: this rule's heuristic looks for a literal top-level
    // `app/layout.tsx`. next-intl's routing convention makes
    // `app/[locale]/layout.tsx` the true root layout instead (it renders
    // <html>/<body> directly, with no non-localized layout above it) — the
    // exact placement Next's own docs require for `beforeInteractive`.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script
      id="travelpayouts-drive"
      src={DRIVE_SCRIPT_URL}
      strategy="beforeInteractive"
      {...DRIVE_VENDOR_ATTRS}
    />
  );
}
