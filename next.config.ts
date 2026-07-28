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
// in production. If the script itself makes its own network calls once
// live, add the exact domain(s) observed in a CSP-violation report/browser
// console — don't broaden connect-src speculatively.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://emrldtp.com${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self';
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
