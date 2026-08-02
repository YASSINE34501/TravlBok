export type FaqJsonLdItem = { q: string; a: string };

/** Builds `FAQPage` JSON-LD from the same `{ q, a }[]` array a FAQ accordion renders, so the visible copy and the structured data can never drift apart. */
export function buildFaqPageJsonLd(items: FaqJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
