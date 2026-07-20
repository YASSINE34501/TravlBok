import { Link } from "@/i18n/navigation";
import { getPartnerContext } from "@/lib/partner-context";
import { PartnerSidebar } from "@/components/layout/partner-sidebar";
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold text-primary">
            TravlBok
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{organization.displayName}</span>
            <Badge variant="secondary">{organization.verificationStatus}</Badge>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8">
        <aside className="w-56 shrink-0">
          <PartnerSidebar organizationType={organization.type} />
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
