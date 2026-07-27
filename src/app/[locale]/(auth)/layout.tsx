import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/icons/brand-logo";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="px-4 py-5 sm:px-6">
        <Link href="/" className="flex w-fit items-center">
          <BrandLogo className="h-16 w-auto" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
