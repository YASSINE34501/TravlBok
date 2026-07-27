import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { getAdminNavGroups } from "@/components/layout/admin-nav";
import { NotificationBell } from "@/components/layout/notification-bell";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ROLE_GROUPS.platformStaff);
  const t = await getTranslations("Admin");
  const navGroups = getAdminNavGroups(t);

  return (
    <AppShell
      brand={
        <Link href="/" className="flex items-center">
          <Image src="/brand/icon-mark.png" alt="TravlBok" width={550} height={550} className="size-11" />
        </Link>
      }
      navGroups={navGroups}
      topbarActions={<NotificationBell locale={locale} />}
    >
      {children}
    </AppShell>
  );
}
