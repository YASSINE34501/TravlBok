import { describe, it, expect } from "vitest";
import { buildFaqPageJsonLd } from "@/lib/seo/faq-jsonld";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { buildItemListJsonLd } from "@/lib/seo/item-list-jsonld";

describe("buildFaqPageJsonLd", () => {
  it("builds one Question/Answer pair per real FAQ item, in order", () => {
    const jsonLd = buildFaqPageJsonLd([
      { q: "How accurate are these prices?", a: "They're recently found cached fares." },
      { q: "Where do I pay?", a: "On our partner's website." },
    ]);
    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity).toHaveLength(2);
    expect(jsonLd.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "How accurate are these prices?",
      acceptedAnswer: { "@type": "Answer", text: "They're recently found cached fares." },
    });
  });

  it("produces an empty mainEntity for an empty item list — callers must hide the section entirely rather than render an empty FAQPage", () => {
    expect(buildFaqPageJsonLd([]).mainEntity).toEqual([]);
  });
});

describe("structured-data builders never include invented statistics", () => {
  it("BreadcrumbList entries only ever carry position/name/item — no rating or availability fields", () => {
    const jsonLd = buildBreadcrumbJsonLd("en", [{ label: "Flights", href: "/flights" }, { label: "Paris" }]);
    for (const entry of jsonLd.itemListElement) {
      expect(Object.keys(entry).sort()).toEqual(
        expect.arrayContaining(["@type", "position", "name"])
      );
      expect(entry).not.toHaveProperty("aggregateRating");
    }
  });

  it("ItemList entries only ever carry position/name/url", () => {
    const jsonLd = buildItemListJsonLd([{ name: "Royal Air Maroc CMN → CDG", url: "https://travlbok.com/en/flights/offers/x" }]);
    expect(Object.keys(jsonLd.itemListElement[0]).sort()).toEqual(["@type", "name", "position", "url"]);
  });
});
