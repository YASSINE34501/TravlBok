import {
  LayoutDashboard,
  Building2,
  Car,
  MapPinned,
  CalendarCheck,
  CalendarDays,
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
  Radio,
  KeyRound,
} from "lucide-react";
import type { OrganizationType } from "@/generated/prisma/client";
import type { SidebarNavGroup } from "@/components/layout/sidebar-nav";

function getPartnerNavGroups(
  organizationType: OrganizationType,
  t: (key: string) => string
): SidebarNavGroup[] {
  if (organizationType === "AFFILIATE") {
    return [
      {
        items: [
          { href: "/dashboard", label: t("dashboard"), icon: <LayoutDashboard />, exactMatch: true },
          { href: "/dashboard/organization", label: t("settings"), icon: <Settings /> },
        ],
      },
      {
        label: t("affiliateOverview"),
        items: [
          {
            href: "/dashboard/affiliate",
            label: t("affiliateOverview"),
            icon: <Link2 />,
            exactMatch: true,
          },
          {
            href: "/dashboard/affiliate/campaigns",
            label: t("affiliateCampaigns"),
            icon: <Link2 />,
          },
          {
            href: "/dashboard/affiliate/withdrawals",
            label: t("affiliateWithdrawals"),
            icon: <Wallet />,
          },
          {
            href: "/dashboard/affiliate/promo-materials",
            label: t("affiliatePromoMaterials"),
            icon: <ImageIcon />,
          },
        ],
      },
    ];
  }

  return [
    {
      items: [
        { href: "/dashboard", label: t("dashboard"), icon: <LayoutDashboard />, exactMatch: true },
        { href: "/dashboard/organization", label: t("settings"), icon: <Settings /> },
      ],
    },
    ...(organizationType === "HOTEL"
      ? [
          {
            label: t("properties"),
            items: [
              { href: "/dashboard/properties", label: t("properties"), icon: <Building2 /> },
              {
                href: "/dashboard/pms",
                label: t("pmsFrontDesk"),
                icon: <ClipboardList />,
                exactMatch: true,
              },
              {
                href: "/dashboard/pms/calendar",
                label: t("pmsCalendar"),
                icon: <CalendarDays />,
              },
              {
                href: "/dashboard/pms/housekeeping",
                label: t("pmsHousekeeping"),
                icon: <ClipboardList />,
              },
              {
                href: "/dashboard/pms/maintenance",
                label: t("pmsMaintenance"),
                icon: <Wrench />,
              },
              { href: "/dashboard/pms/reports", label: t("pmsReports"), icon: <BarChart3 /> },
              { href: "/dashboard/channels", label: t("channels"), icon: <Radio /> },
              { href: "/dashboard/pricing", label: t("pricing"), icon: <BarChart3 /> },
            ],
          },
        ]
      : []),
    ...(organizationType === "CAR_RENTAL"
      ? [
          {
            label: t("vehicles"),
            items: [
              { href: "/dashboard/branches", label: t("branches"), icon: <MapPinned /> },
              { href: "/dashboard/vehicles", label: t("vehicles"), icon: <Car /> },
            ],
          },
        ]
      : []),
    {
      label: t("bookings"),
      items: [
        { href: "/dashboard/bookings", label: t("bookings"), icon: <CalendarCheck /> },
        { href: "/dashboard/reviews", label: t("reviews"), icon: <Star /> },
        { href: "/dashboard/payments", label: t("payments"), icon: <Wallet /> },
        { href: "/dashboard/invoices", label: t("invoices"), icon: <Receipt /> },
      ],
    },
    {
      label: t("settings"),
      items: [
        { href: "/dashboard/staff", label: t("staff"), icon: <Users /> },
        { href: "/dashboard/subscription", label: t("subscription"), icon: <CreditCard /> },
        { href: "/dashboard/api-keys", label: t("apiKeys"), icon: <KeyRound /> },
      ],
    },
  ];
}

export { getPartnerNavGroups };
