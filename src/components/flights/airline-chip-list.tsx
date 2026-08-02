import { Plane } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { slugify } from "@/lib/flights/slugs";

/** The airline pill-list pattern from `flights-landing.tsx`'s Featured Airlines section, reused on destination/route/airline pages. Each chip links to that airline's own page — one more real internal link, no extra data fetch (the slug is deterministic from the real airline name). */
export function AirlineChipList({ airlineNames }: { airlineNames: string[] }) {
  if (airlineNames.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {airlineNames.map((name) => (
        <Link
          key={name}
          href={`/flights/airlines/${slugify(name)}`}
          className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Plane className="size-4 text-primary" />
          {name}
        </Link>
      ))}
    </div>
  );
}
