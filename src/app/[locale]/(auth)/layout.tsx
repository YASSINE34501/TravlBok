import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Common");

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="border-b bg-background px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-primary">
          {t("brand")}
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
