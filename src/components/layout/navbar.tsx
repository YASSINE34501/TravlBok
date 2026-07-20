import { getTranslations } from "next-intl/server";
import { Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { auth } from "@/lib/auth";
import { isPlatformStaff, ROLE_GROUPS } from "@/lib/rbac";
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

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-semibold text-primary">
            {tCommon("brand")}
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>

          {session?.user ? (
            <UserMenu
              name={session.user.name ?? session.user.email ?? ""}
              email={session.user.email ?? ""}
              image={session.user.image}
              isPartnerOrStaff={isPartnerOrStaff}
              dashboardHref={dashboardHref}
            />
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" render={<Link href="/login" />}>
                {t("login")}
              </Button>
              <Button render={<Link href="/register" />}>{t("register")}</Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>{tCommon("brand")}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
                  >
                    {t(link.key)}
                  </Link>
                ))}
                <div className="my-2 border-t pt-2">
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
