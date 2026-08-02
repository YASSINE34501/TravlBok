/** Minimal, truthful `ItemList` JSON-LD — position/name/url only. Deliberately no `Offer`/price/rating/availability fields nested inside each `ListItem`: those aren't reliable enough from a cached-fare API to assert as structured facts, and schema.org doesn't require them for a plain list reference. */
export function buildItemListJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
