"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Car,
  Users,
  ScrollText,
  Globe,
  MapPin,
  Tag,
  LayoutList,
  ShieldCheck,
  Percent,
  Ticket,
  FileText,
  LayoutGrid,
  Star,
  Settings,
  CreditCard,
  Wallet,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const t = useTranslations("Admin");
  const pathname = usePathname();

  const items = [
    { href: "/admin", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/admin/organizations", label: "Organizations", icon: Building2 },
    { href: "/admin/hotels", label: t("totalHotels"), icon: BedDouble },
    { href: "/admin/vehicles", label: t("totalVehicles"), icon: Car },
    { href: "/admin/users", label: t("users"), icon: Users },
    { href: "/admin/subscription-plans", label: t("subscriptionPlans"), icon: CreditCard },
    { href: "/admin/subscriptions", label: t("subscriptions"), icon: Wallet },
    { href: "/admin/exchange-rates", label: t("exchangeRates"), icon: Globe },
    { href: "/admin/countries", label: t("countries"), icon: Globe },
    { href: "/admin/cities", label: t("cities"), icon: MapPin },
    { href: "/admin/amenities", label: t("amenities"), icon: Tag },
    { href: "/admin/categories", label: t("categories"), icon: LayoutList },
    { href: "/admin/cancellation-policies", label: t("cancellationPolicies"), icon: ShieldCheck },
    { href: "/admin/commission-rules", label: t("commissions"), icon: Percent },
    { href: "/admin/coupons", label: t("coupons"), icon: Ticket },
    { href: "/admin/cms", label: t("cmsPages"), icon: FileText },
    { href: "/admin/homepage-sections", label: t("homepageSections"), icon: LayoutGrid },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
    { href: "/admin/audit-logs", label: t("auditLogs"), icon: ScrollText },
    { href: "/admin/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
