import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";

// Deliberately the "without nonces" CSP approach (see
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md) —
// a nonce-based policy requires every page to opt into dynamic rendering,
// which would disable static optimization across this app's many marketplace
// pages. `img-src https:` (not a fixed allowlist) matches `images.remotePatterns`
// below, which already accepts any HTTPS host for partner-uploaded photos.
// emrldtp.com is the Travelpayouts Drive script's host (see
// GlobalAffiliateScript, mounted in the [locale] root layout) — without it
// allowlisted here, CSP silently blocks that <script src> from ever loading
// in production. It also fetches its own config from
// emrldtp.com/entrypoint_config at runtime (confirmed via a real browser
// console check: without connect-src allowlisting this exact host, that
// fetch is blocked and the script logs "config is not valid" and never
// finishes initializing) — this is the one domain observed in that
// CSP-violation report; don't broaden connect-src beyond it speculatively.
//
// tpembd.com is the separate host for the official Travelpayouts Flights
// Search Form widget (see TravelpayoutsFlightWidget, mounted in the
// homepage's HeroSearch "flights" tab) — a different Travelpayouts product
// from the Drive script, confirmed via a real browser console check to need
// its own script-src entry (the script load itself was CSP-blocked without
// it, distinct from the Drive script's separate connect-src issue).
// (avsplow.com — a connect-src request this widget also makes — was tried
// and reverted: allowlisting it did not change whether the widget rendered,
// so it wasn't a proven requirement; the actual fix was moving off
// next/script to a ref-scoped insertion, see TravelpayoutsFlightWidget.)
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://emrldtp.com https://tpembd.com${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self' https://emrldtp.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  // Lean, self-contained Docker images: emits .next/standalone with only the
  // files actually needed at runtime (no full node_modules copy required).
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
