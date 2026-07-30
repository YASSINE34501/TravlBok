"use client";

import { useEffect, useRef } from "react";

// Official Travelpayouts Flights Search Form widget — approved, exact
// embed code, parameters unmodified. `color_button`/`color_button_text`
// already match the TravlBok brand tokens (gold primary / dark ink text).
// `locale=en` is fixed by the approved embed and intentionally not varied
// per site locale — changing it would modify an approved parameter.
const WIDGET_SRC =
  "https://tpembd.com/content?currency=usd&trs=554594&shmarker=755720&locale=en&stops=0&show_hotels=true&powered_by=true&border_radius=0&plain=true&color_button=%23FDBA06&color_button_text=%230F172A&promo_id=3414&campaign_id=111";

const WIDGET_SCRIPT_ID = "travelpayouts-flights-widget";

/**
 * Not `next/script`: this vendor script inserts its own `<tp-cascoon>`
 * custom element relative to *where its own `<script>` tag lives in the
 * DOM* — confirmed by inspecting a real page load. `next/script`'s
 * non-`beforeInteractive` strategies (the only ones valid outside the root
 * layout) always detach the script element and append it to `document.body`
 * instead of rendering it in place, which left the widget's real content
 * floating as an orphaned sibling at the end of `<body>` instead of inside
 * this tab panel. A plain DOM-inserted `<script>`, appended directly into
 * this component's own ref'd container, keeps the vendor's relative
 * insertion working correctly.
 *
 * Still loads exactly once: guarded by checking for the script's `id` in
 * the document before inserting, same guarantee `next/script`'s own `id`
 * dedup would have given for the case that actually applied here.
 */
export function TravelpayoutsFlightWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (document.getElementById(WIDGET_SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = WIDGET_SCRIPT_ID;
    script.src = WIDGET_SRC;
    script.async = true;
    script.charset = "utf-8";
    containerRef.current?.appendChild(script);
  }, []);

  return <div ref={containerRef} className="min-h-[220px] w-full" />;
}
