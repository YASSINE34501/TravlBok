import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type FaqItem = { q: string; a: string };

export default async function CmsPagePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const page = await prisma.cmsPage.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
  if (!page) notFound();

  const title = pickLocaleText(page.title as Record<string, unknown>, locale);
  const content = page.content as Record<
    string,
    { body?: string; items?: FaqItem[] } | undefined
  >;
  const localeContent = content[locale] ?? content.en;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{title}</h1>

      {localeContent?.body && (
        <p className="mt-6 whitespace-pre-line leading-relaxed text-muted-foreground">
          {localeContent.body}
        </p>
      )}

      {localeContent?.items && (
        <Accordion className="mt-6">
          {localeContent.items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </main>
  );
}
