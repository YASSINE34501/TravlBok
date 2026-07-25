import { getTranslations, getLocale } from "next-intl/server";
import { Menu, Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { auth } from "@/lib/auth";
import { isPlatformStaff, ROLE_GROUPS } from "@/lib/rbac";
import { isRtlLocale } from "@/i18n/routing";
import type { Role } from "@/generated/prisma/client";

const NAV_LINKS = [
  { href: "/hotels", key: "hotels" },
  { href: "/cars", key: "carRentals" },
  { href: "/destinations", key: "destinations" },
  { href: "/deals", key: "deals" },
] as const;

export async function Navbar() {
  const t = await getTranslations("Nav");
  const tCommon = await getTranslations("Common");
  const session = await auth();
  const locale = await getLocale();

  const role = session?.user?.role as Role | undefined;
  const isPartnerOrStaff = Boolean(
    role &&
      (isPlatformStaff(role) ||
        ROLE_GROUPS.hotelStaff.includes(role) ||
        ROLE_GROUPS.carRentalStaff.includes(role) ||
        role === "TRAVEL_AGENCY" ||
        role === "TOUR_PROVIDER" ||
        role === "AFFILIATE_PARTNER")
  );
  const dashboardHref = role && isPlatformStaff(role) ? "/admin" : "/dashboard";
  const mobileSheetSide = isRtlLocale(locale) ? "left" : "right";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Compass className="size-4.5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {tCommon("brand")}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1 sm:flex">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>

          {session?.user ? (
            <>
              <NotificationBell locale={locale} />
              <UserMenu
                name={session.user.name ?? session.user.email ?? ""}
                email={session.user.email ?? ""}
                image={session.user.image}
                isPartnerOrStaff={isPartnerOrStaff}
                dashboardHref={dashboardHref}
              />
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" render={<Link href="/login" />}>
                {t("login")}
              </Button>
              <Button render={<Link href="/register" />}>{t("register")}</Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side={mobileSheetSide} className="w-72 gap-0 p-0">
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle className="flex items-center gap-2 text-primary">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Compass className="size-4" />
                  </span>
                  <span className="text-foreground">{tCommon("brand")}</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3" aria-label="Main">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    {t(link.key)}
                  </Link>
                ))}
                <div className="my-2 flex items-center gap-1 border-t pt-3">
                  <LanguageSwitcher />
                  <CurrencySwitcher />
                </div>
                {!session?.user && (
                  <div className="mt-2 flex flex-col gap-2">
                    <Button variant="outline" render={<Link href="/login" />}>
                      {t("login")}
                    </Button>
                    <Button render={<Link href="/register" />}>
                      {t("register")}
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
