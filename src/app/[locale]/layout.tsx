import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono, Noto_Kufi_Arabic } from "next/font/google";
import { routing, isRtlLocale, type Locale } from "@/i18n/routing";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { CurrencyProvider } from "@/components/currency-provider";
import { getPreferredCurrency } from "@/lib/currency/cookie";
import { GlobalAffiliateScript } from "@/components/marketplace/global-affiliate-script";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoKufiArabic = Noto_Kufi_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(appUrl),
    title: {
      default: t("title"),
      template: `%s | TravlBok`,
    },
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: "TravlBok",
      locale,
      type: "website",
      // Explicit absolute URLs, not a relative path — opengraph-image.tsx
      // lives at the true app/ root (a sibling of [locale], not a
      // descendant), so it has no ancestor metadataBase of its own to
      // resolve a relative path against. An absolute URL sidesteps that
      // entirely (and keeps the image statically generated — nesting it
      // under [locale] to inherit metadataBase was tried and reverted: it
      // turned a cached static route into a per-request dynamic one).
      images: [`${appUrl}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`${appUrl}/twitter-image`],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  const preferredCurrency = await getPreferredCurrency();

  return (
    <html
      lang={locale}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${notoKufiArabic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <GlobalAffiliateScript />
        <NextIntlClientProvider>
          <AuthSessionProvider>
            <CurrencyProvider initialCurrency={preferredCurrency}>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
              >
                <TooltipProvider>
                  {children}
                  <Toaster
                    position={dir === "rtl" ? "top-left" : "top-right"}
                    dir={dir}
                  />
                </TooltipProvider>
              </ThemeProvider>
            </CurrencyProvider>
          </AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export type { Locale };
