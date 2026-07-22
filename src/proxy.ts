import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing, locales, type Locale } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Super Admin's configured default locale (GlobalSetting) only ever matters
// for a bare, unprefixed "/" visit with no locale cookie yet — everywhere
// else next-intl's own locale negotiation (cookie/Accept-Language/prefix)
// is left untouched. Prisma's node-postgres adapter can't run on the Edge
// runtime this proxy executes in, so the setting is read via an internal
// Node-runtime API route instead of querying the database directly here.
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/" && !request.cookies.get("TRAVLBOK_LOCALE")) {
    try {
      const response = await fetch(new URL("/api/settings/default-locale", request.url));
      if (response.ok) {
        const { defaultLocale } = (await response.json()) as { defaultLocale: string };
        if (locales.includes(defaultLocale as Locale)) {
          return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
        }
      }
    } catch {
      // Fall through to next-intl's own default-locale negotiation below.
    }
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
