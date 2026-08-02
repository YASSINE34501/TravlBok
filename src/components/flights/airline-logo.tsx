"use client";

import { useState } from "react";
import Image from "next/image";
import { Plane } from "lucide-react";

/**
 * Travelpayouts' own public airline-logo CDN, keyed off the real resolved
 * IATA code — approved as the "existing" airline-logo source since no
 * asset/CDN of our own exists in the repo. Falls back to the site's
 * existing generic Plane-icon treatment on load error (an airline whose
 * logo isn't in that CDN's set) — never a broken image.
 */
export function AirlineLogo({ code, name, size = 64 }: { code: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
        style={{ width: size, height: size }}
      >
        <Plane className="size-1/2" />
      </span>
    );
  }

  return (
    <Image
      src={`https://pics.avs.io/200/200/${code}.png`}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 rounded-xl border bg-white object-contain"
      onError={() => setFailed(true)}
    />
  );
}
