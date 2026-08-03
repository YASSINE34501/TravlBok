import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Presentational shell for one field of the homepage search panel: a tall
 * rounded box holding a small uppercase caption above an icon + control row.
 *
 * Purely visual — it owns no state and no submit behaviour. Every field keeps
 * its own `id`/`value`/`onChange` at the call site so the search params each
 * form builds are untouched by the redesign.
 */
export function SearchFieldShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-background/70 px-4 py-2.5 text-start transition-all duration-200",
        "hover:border-primary/45 focus-within:border-primary focus-within:bg-background focus-within:ring-3 focus-within:ring-primary/15",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SearchFieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
    >
      {children}
    </Label>
  );
}

/** Icon + control row that sits under the caption inside a `SearchFieldShell`. */
export function SearchFieldRow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-1 flex items-center gap-2.5">
      <Icon className="size-4.5 shrink-0 text-primary" strokeWidth={1.75} />
      {children}
    </div>
  );
}

/**
 * Borderless input styling for controls inside a shell — the shell already
 * draws the border and focus ring, so the input itself must not draw its own.
 */
export const SEARCH_FIELD_INPUT_CLASS =
  "h-6 w-full min-w-0 border-0 bg-transparent p-0 text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground";
