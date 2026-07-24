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
  Receipt,
  Handshake,
  Banknote,
  Radio,
  BarChart3,
} from "lucide-react";
import type { SidebarNavGroup } from "@/components/layout/sidebar-nav";

function getAdminNavGroups(t: (key: string) => string): SidebarNavGroup[] {
  return [
    {
      items: [
        { href: "/admin", label: t("dashboard"), icon: <LayoutDashboard />, exactMatch: true },
        { href: "/admin/analytics", label: t("advancedAnalytics"), icon: <BarChart3 /> },
      ],
    },
    {
      label: "Partners & inventory",
      items: [
        { href: "/admin/organizations", label: "Organizations", icon: <Building2 /> },
        { href: "/admin/hotels", label: t("totalHotels"), icon: <BedDouble /> },
        { href: "/admin/vehicles", label: t("totalVehicles"), icon: <Car /> },
        { href: "/admin/users", label: t("users"), icon: <Users /> },
      ],
    },
    {
      label: "Billing",
      items: [
        {
          href: "/admin/subscription-plans",
          label: t("subscriptionPlans"),
          icon: <CreditCard />,
        },
        { href: "/admin/subscriptions", label: t("subscriptions"), icon: <Wallet /> },
        { href: "/admin/payments", label: "Payments", icon: <Wallet /> },
        { href: "/admin/invoices", label: "Invoices", icon: <Receipt /> },
        { href: "/admin/withdrawals", label: "Withdrawals", icon: <Banknote /> },
      ],
    },
    {
      label: t("affiliates"),
      items: [
        {
          href: "/admin/affiliates",
          label: t("affiliates"),
          icon: <Handshake />,
          exactMatch: true,
        },
        {
          href: "/admin/affiliates/commission-rules",
          label: "Affiliate commissions",
          icon: <Percent />,
        },
        { href: "/admin/affiliates/settings", label: "Affiliate settings", icon: <Settings /> },
      ],
    },
    {
      label: "Distribution",
      items: [
        { href: "/admin/channels", label: t("channelManager"), icon: <Radio /> },
        { href: "/admin/pricing", label: t("dynamicPricing"), icon: <Percent /> },
        { href: "/admin/exchange-rates", label: t("exchangeRates"), icon: <Globe /> },
      ],
    },
    {
      label: "Catalog",
      items: [
        { href: "/admin/countries", label: t("countries"), icon: <Globe /> },
        { href: "/admin/cities", label: t("cities"), icon: <MapPin /> },
        { href: "/admin/amenities", label: t("amenities"), icon: <Tag /> },
        { href: "/admin/categories", label: t("categories"), icon: <LayoutList /> },
        {
          href: "/admin/cancellation-policies",
          label: t("cancellationPolicies"),
          icon: <ShieldCheck />,
        },
        { href: "/admin/commission-rules", label: t("commissions"), icon: <Percent /> },
        { href: "/admin/coupons", label: t("coupons"), icon: <Ticket /> },
      ],
    },
    {
      label: "Content",
      items: [
        { href: "/admin/cms", label: t("cmsPages"), icon: <FileText /> },
        { href: "/admin/homepage-sections", label: t("homepageSections"), icon: <LayoutGrid /> },
        { href: "/admin/reviews", label: "Reviews", icon: <Star /> },
      ],
    },
    {
      label: "System",
      items: [
        { href: "/admin/audit-logs", label: t("auditLogs"), icon: <ScrollText /> },
        { href: "/admin/settings", label: t("settings"), icon: <Settings /> },
      ],
    },
  ];
}

export { getAdminNavGroups };
