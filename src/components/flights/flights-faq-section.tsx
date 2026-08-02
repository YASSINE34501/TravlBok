import { ShieldCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { JsonLd } from "@/components/seo/json-ld";
import { buildFaqPageJsonLd, type FaqJsonLdItem } from "@/lib/seo/faq-jsonld";

export type FaqItem = FaqJsonLdItem;

/**
 * Renders the FAQ accordion and its `FAQPage` JSON-LD from one shared
 * `items` array, so the visible copy and the structured data can never
 * drift out of sync with each other.
 */
export function FlightsFaqSection({ title, items }: { title: string; items: FaqItem[] }) {
  if (items.length === 0) return null;

  const faqJsonLd = buildFaqPageJsonLd(items);

  return (
    <section className="py-12 sm:py-16">
      <JsonLd data={faqJsonLd} />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        </div>
        <Accordion className="mt-6">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
