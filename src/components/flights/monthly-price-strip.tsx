import type { MonthlyPrice } from "@/domains/distribution/providers/aviasales-landing";

/** The "Best Prices by Month" grid, extracted from `flights-landing.tsx`'s inline version for reuse on destination/route pages. */
export function MonthlyPriceStrip({
  title,
  subtitle,
  monthlyPrices,
  locale,
  formatPrice,
}: {
  title: string;
  subtitle?: string;
  monthlyPrices: MonthlyPrice[];
  locale: string;
  formatPrice: (amount: number) => string;
}) {
  if (monthlyPrices.length === 0) return null;

  const monthLabel = (month: string) =>
    new Date(`${month}-01`).toLocaleDateString(locale, { month: "long", year: "numeric" });

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {monthlyPrices.map((entry) => (
            <div key={entry.month} className="rounded-xl border bg-card p-4 text-center shadow-sm">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {monthLabel(entry.month)}
              </p>
              <p className="mt-1 text-lg font-semibold text-primary">{formatPrice(entry.minPriceAmount)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
