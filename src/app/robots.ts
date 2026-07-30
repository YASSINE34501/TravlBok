import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

// Disallow patterns use a leading single-segment wildcard since every
// route is served under a locale prefix (/en, /fr, /ar via
// `localePrefix: "always"` — no bare-root pages exist). Static assets
// (_next, /icons, /brand, image files) are never disallowed — only actual
// private/internal route trees are.
export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/*/admin/",
        "/*/dashboard/",
        "/*/account/",
        "/*/bookings/",
        "/*/unauthorized",
        "/*/verify-email/",
        "/*/forgot-password",
        "/*/reset-password",
        "/*/go/",
        "/*/r/",
        "/api/",
      ],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
