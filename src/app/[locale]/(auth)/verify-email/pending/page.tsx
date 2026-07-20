import { setRequestLocale, getTranslations } from "next-intl/server";
import { MailCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export default async function VerifyEmailPendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <MailCheck className="size-10 text-primary" />
        <CardTitle>{t("verifyEmailTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          {t("verifyEmailSubtitle")}
        </p>
        <ResendVerificationForm locale={locale} />
      </CardContent>
    </Card>
  );
}
