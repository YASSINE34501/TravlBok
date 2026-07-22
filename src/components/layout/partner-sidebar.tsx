"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Building2,
  Car,
  MapPinned,
  CalendarCheck,
  Star,
  Settings,
  Users,
  CreditCard,
  Wallet,
  Receipt,
  Link2,
  Image as ImageIcon,
  ClipboardList,
  Wrench,
  BarChart3,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { OrganizationType } from "@/generated/prisma/client";

export function PartnerSidebar({
  organizationType,
}: {
  organizationType: OrganizationType;
}) {
  const t = useTranslations("Partner");
  const pathname = usePathname();

  const items =
    organizationType === "AFFILIATE"
      ? [
          { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
          { href: "/dashboard/organization", label: t("settings"), icon: Settings },
          { href: "/dashboard/affiliate", label: t("affiliateOverview"), icon: Link2 },
          { href: "/dashboard/affiliate/campaigns", label: t("affiliateCampaigns"), icon: Link2 },
          {
            href: "/dashboard/affiliate/withdrawals",
            label: t("affiliateWithdrawals"),
            icon: Wallet,
          },
          {
            href: "/dashboard/affiliate/promo-materials",
            label: t("affiliatePromoMaterials"),
            icon: ImageIcon,
          },
        ]
      : [
          { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
          { href: "/dashboard/organization", label: t("settings"), icon: Settings },
          ...(organizationType === "HOTEL"
            ? [
                { href: "/dashboard/properties", label: t("properties"), icon: Building2 },
                { href: "/dashboard/pms", label: t("pmsFrontDesk"), icon: ClipboardList },
                { href: "/dashboard/pms/housekeeping", label: t("pmsHousekeeping"), icon: ClipboardList },
                { href: "/dashboard/pms/maintenance", label: t("pmsMaintenance"), icon: Wrench },
                { href: "/dashboard/pms/reports", label: t("pmsReports"), icon: BarChart3 },
              ]
            : []),
          ...(organizationType === "CAR_RENTAL"
            ? [
                { href: "/dashboard/branches", label: t("branches"), icon: MapPinned },
                { href: "/dashboard/vehicles", label: t("vehicles"), icon: Car },
              ]
            : []),
          { href: "/dashboard/bookings", label: t("bookings"), icon: CalendarCheck },
          { href: "/dashboard/reviews", label: t("reviews"), icon: Star },
          { href: "/dashboard/payments", label: t("payments"), icon: Wallet },
          { href: "/dashboard/invoices", label: t("invoices"), icon: Receipt },
          { href: "/dashboard/staff", label: t("staff"), icon: Users },
          { href: "/dashboard/subscription", label: t("subscription"), icon: CreditCard },
        ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
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
