import { getTranslations, getLocale } from "next-intl/server";
import { Menu, ChevronDown, Heart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/icons/brand-logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

/**
 * Shared nav-item styling: a gold underline that grows from the centre on
 * hover instead of the previous grey pill fill — quieter at rest, which lets
 * the two auth buttons stay the only high-contrast targets in the bar.
 */
const NAV_LINK_CLASS =
  "relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground/75 transition-colors duration-200 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-200 hover:after:scale-x-100";

const NAV_LINKS = [
  { href: "/flights", key: "flights" },
  { href: "/cars", key: "carRentals" },
  { href: "/packages", key: "packages" },
  { href: "/deals", key: "deals" },
  { href: "/destinations", key: "destinations" },
] as const;

export async function Navbar() {
  const t = await getTranslations("Nav");
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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="flex flex-col justify-center rounded-lg transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <BrandLogo variant="navbar" className="h-8 w-auto sm:h-9" />
            <span className="hidden text-[11px] font-medium text-muted-foreground xl:block">
              {t("tagline")}
            </span>
          </Link>
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={NAV_LINK_CLASS}
                  />
                }
              >
                {t("hotels")}
                <ChevronDown className="size-3.5 transition-transform duration-200 data-popup-open:-rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-52 rounded-xl p-1.5 shadow-xl">
                <DropdownMenuItem
                  className="rounded-lg px-3 py-2.5 text-sm font-medium focus:bg-primary/10 focus:text-foreground"
                  render={<Link href="/hotels" />}
                >
                  {t("hotelsMenuAllHotels")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg px-3 py-2.5 text-sm font-medium focus:bg-primary/10 focus:text-foreground"
                  render={<Link href="/destinations" />}
                >
                  {t("hotelsMenuDestinations")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg px-3 py-2.5 text-sm font-medium focus:bg-primary/10 focus:text-foreground"
                  render={<Link href="/deals" />}
                >
                  {t("hotelsMenuDeals")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
                {t(link.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1 sm:flex">
            <LanguageSwitcher />
            <CurrencySwitcher />
            <Button variant="ghost" size="sm" render={<Link href="/faq" />}>
              {t("support")}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="hidden transition-colors hover:text-primary sm:inline-flex"
            disabled
            aria-label={t("wishlistComingSoon")}
            title={t("wishlistComingSoon")}
          >
            <Heart className="size-4.5" />
          </Button>

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
            <div className="hidden items-center gap-2 lg:flex">
              <Button
                variant="outline"
                className="rounded-xl border-primary/45 px-5 font-semibold transition-colors hover:border-primary hover:bg-primary/10"
                render={<Link href="/login" />}
              >
                {t("login")}
              </Button>
              <Button
                className="rounded-xl px-5 font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                render={<Link href="/register" />}
              >
                {t("register")}
              </Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side={mobileSheetSide} className="w-72 gap-0 p-0">
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle className="flex items-center">
                  <BrandLogo variant="navbar" className="h-8 w-auto" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3" aria-label="Main">
                <Link
                  href="/hotels"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  {t("hotels")}
                </Link>
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    {t(link.key)}
                  </Link>
                ))}
                <Link
                  href="/faq"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  {t("support")}
                </Link>
                <div className="my-2 flex items-center gap-1 border-t pt-3">
                  <LanguageSwitcher />
                  <CurrencySwitcher />
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    aria-label={t("wishlistComingSoon")}
                    title={t("wishlistComingSoon")}
                  >
                    <Heart className="size-4.5" />
                  </Button>
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
