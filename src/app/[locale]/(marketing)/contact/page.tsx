import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/contact-form";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("contactTitle"), description: t("contactDescription") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nav");
  const tMarketing = await getTranslations("Marketing");

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t("contact")}</h1>
      <p className="mt-2 text-muted-foreground">
        {tMarketing("contactSubtitle")}
      </p>
      <Card className="mt-8 rounded-2xl p-6 sm:p-8">
        <CardContent className="p-0">
          <ContactForm />
        </CardContent>
      </Card>
    </main>
  );
}
