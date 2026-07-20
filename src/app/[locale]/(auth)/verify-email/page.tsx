import { setRequestLocale, getTranslations } from "next-intl/server";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailAction } from "@/lib/auth/actions";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  const tCommon = await getTranslations("Common");

  const result = token
    ? await verifyEmailAction(token)
    : { success: false as const, error: "missingToken" };

  return (
    <Card>
      <CardHeader className="items-center text-center">
        {result.success ? (
          <CheckCircle2 className="size-10 text-primary" />
        ) : (
          <XCircle className="size-10 text-destructive" />
        )}
        <CardTitle>{t("verifyEmailTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          {result.success ? tCommon("success") : tCommon("somethingWentWrong")}
        </p>
        <Button className="mt-4" render={<Link href="/login" />}>
          {t("signIn")}
        </Button>
      </CardContent>
    </Card>
  );
}
