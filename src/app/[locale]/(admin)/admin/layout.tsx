import { Link } from "@/i18n/navigation";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ROLE_GROUPS.platformStaff);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold text-primary">
            TravlBok Admin
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8">
        <aside className="w-60 shrink-0">
          <AdminSidebar />
        </aside>
        <main className="flex-1 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
