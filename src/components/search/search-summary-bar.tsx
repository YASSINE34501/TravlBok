import { Pencil } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Compact re-editable search-criteria bar shown above results — mirrors the
 * reference OTA's route/criteria header ("Dubai (DXB) ⇄ Istanbul (IST)" +
 * dates/pax + "Modify Search"). "Modify" links back to the homepage search
 * (where the full search form lives) rather than an inline editable form —
 * a smaller, honest scope than fully duplicating HeroSearch inline here.
 */
export function SearchSummaryBar({
  items,
  modifyLabel,
}: {
  items: Array<{ label: string; value: string }>;
  modifyLabel: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm sm:px-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        {items.map((item) => (
          <div key={item.label} className="text-sm">
            <span className="text-muted-foreground">{item.label}: </span>
            <span className="font-medium text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="gap-1.5" render={<Link href="/" />}>
        <Pencil className="size-3.5" />
        {modifyLabel}
      </Button>
    </div>
  );
}
