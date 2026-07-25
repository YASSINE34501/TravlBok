import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Common");

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="px-4 py-5 sm:px-6">
        <Link href="/" className="flex w-fit items-center gap-2 text-primary">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="size-4.5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {t("brand")}
          </span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
