import { getAppUrl } from "@/lib/env";
import type { BreadcrumbNavItem } from "@/components/layout/breadcrumb-nav";

/** Builds a `BreadcrumbList` JSON-LD object from the exact same `items` array passed to `BreadcrumbNav`, so the visible breadcrumb and its structured-data twin can never drift apart. `href` is locale-free (matching `BreadcrumbNav`'s own convention); the last item typically has no `href` (current page). */
export function buildBreadcrumbJsonLd(locale: string, items: BreadcrumbNavItem[]) {
  const appUrl = getAppUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${appUrl}/${locale}${item.href}` } : {}),
    })),
  };
}
