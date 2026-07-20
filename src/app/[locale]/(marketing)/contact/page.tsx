import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/contact-form";

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
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{t("contact")}</h1>
      <p className="mt-2 text-muted-foreground">
        {tMarketing("contactSubtitle")}
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </main>
  );
}
