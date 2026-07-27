import { setRequestLocale, getTranslations } from "next-intl/server";
import { Building2, Car, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function BecomeAPartnerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tMarketing = await getTranslations("Marketing");

  const benefits = [
    tMarketing("partnerBenefit1"),
    tMarketing("partnerBenefit2"),
    tMarketing("partnerBenefit3"),
  ];

  return (
    <main>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-4xl font-semibold">
            {tMarketing("partnerHeroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            {tMarketing("partnerHeroDescription")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-8">
              <Building2 className="size-8 text-primary" />
              <h3 className="text-lg font-semibold">
                {tMarketing("partnerHotelTitle")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tMarketing("partnerHotelDescription")}
              </p>
              <Button render={<Link href="/register/partner?role=HOTEL_OWNER" />}>
                {tMarketing("partnerHotelCta")}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-8">
              <Car className="size-8 text-primary" />
              <h3 className="text-lg font-semibold">
                {tMarketing("partnerCarTitle")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tMarketing("partnerCarDescription")}
              </p>
              <Button render={<Link href="/register/partner?role=CAR_RENTAL_OWNER" />}>
                {tMarketing("partnerCarCta")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <ul className="mx-auto mt-12 max-w-md space-y-3">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              {benefit}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
