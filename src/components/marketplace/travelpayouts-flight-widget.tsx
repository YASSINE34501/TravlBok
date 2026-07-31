"use client";

import { useEffect, useRef } from "react";

// Official Travelpayouts Flights Search Form widget — third-party embed,
// treated as a black box. Exact script tag, parameters unchanged. Inserted
// manually (not JSX, not next/script) because both React 19's built-in
// script hoisting and next/script relocate <script src> out of the
// container into <head>/<body>, which breaks this widget's DOM-relative
// mounting. This is the only insertion method that keeps the script — and
// the widget's own rendered output — inside the container below.
const WIDGET_SRC =
  "https://tpembd.com/content?currency=usd&trs=554594&shmarker=755720&locale=en&stops=any&show_hotels=false&powered_by=true&border_radius=0&plain=true&color_button=%23FDBA06&color_button_text=%23ffffff&promo_id=3414&campaign_id=111";

export function TravelpayoutsFlightWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.querySelector("script")) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = WIDGET_SRC;
    script.charset = "utf-8";
    container.appendChild(script);
  }, []);

  return <div ref={containerRef} className="min-h-[220px] w-full" />;
}
