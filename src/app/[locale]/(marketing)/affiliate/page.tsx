import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link2, TrendingUp, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function AffiliateProgramPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tMarketing = await getTranslations("Marketing");

  const steps = [
    {
      icon: Link2,
      title: tMarketing("affiliateStep1Title"),
      description: tMarketing("affiliateStep1Description"),
    },
    {
      icon: TrendingUp,
      title: tMarketing("affiliateStep2Title"),
      description: tMarketing("affiliateStep2Description"),
    },
    {
      icon: Wallet,
      title: tMarketing("affiliateStep3Title"),
      description: tMarketing("affiliateStep3Description"),
    },
  ];

  return (
    <main>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-4xl font-semibold">{t("affiliateCta")}</h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            {t("affiliateCtaDescription")}
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-6"
            render={<Link href="/register" />}
          >
            {t("affiliateCtaButton")}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.title}>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <step.icon className="size-8 text-primary" />
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          {tMarketing("affiliateComingSoon")}
        </p>
      </section>
    </main>
  );
}
