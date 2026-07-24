import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPartnerContext } from "@/lib/partner-context";
import { AppShell } from "@/components/layout/app-shell";
import { getPartnerNavGroups } from "@/components/layout/partner-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Badge } from "@/components/ui/badge";

export default async function PartnerDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { organization } = await getPartnerContext(locale);
  const t = await getTranslations("Partner");
  const navGroups = getPartnerNavGroups(organization.type, t);

  return (
    <AppShell
      brand={
        <Link href="/" className="text-lg font-semibold text-primary">
          TravlBok
        </Link>
      }
      navGroups={navGroups}
      topbarActions={
        <>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm font-medium">{organization.displayName}</span>
            <Badge variant="secondary">{organization.verificationStatus}</Badge>
          </div>
          <NotificationBell locale={locale} />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
