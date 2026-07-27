import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <div className="space-y-4">
      <RegisterForm locale={locale} />
      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("signIn")}
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground">
        {t("areYouAPartner")}{" "}
        <Link href="/register/partner" className="font-medium text-primary hover:underline">
          {t("listYourProperty")}
        </Link>
      </p>
    </div>
  );
}
