"use client"

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { formatMoney } from "@/lib/currency/format"
import type { CurrencyCode } from "@/lib/currency/config"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/charts/chart-container"

interface BarChartProps {
  data: Array<Record<string, unknown>>
  index: string
  categories: string[]
  config: ChartConfig
  className?: string
  showLegend?: boolean
  stacked?: boolean
  /** Only safe to pass from a Client Component — a plain function prop from a
   * Server Component is not serializable. Server Components should pass
   * `currency`/`locale` instead, which build the formatter internally. */
  valueFormatter?: (value: number) => string
  /** Formats values as money client-side — the server-safe alternative to
   * `valueFormatter` when this chart is rendered from a Server Component. */
  currency?: CurrencyCode
  locale?: string
}

function BarChart({
  data,
  index,
  categories,
  config,
  className,
  showLegend = categories.length > 1,
  stacked = false,
  valueFormatter,
  currency,
  locale,
}: BarChartProps) {
  const resolvedFormatter =
    currency && locale ? (value: number) => formatMoney(value, currency, locale) : valueFormatter
  return (
    <ChartContainer config={config} className={className}>
      <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={index} tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={40}
          tickFormatter={resolvedFormatter}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={
                resolvedFormatter
                  ? (item) => resolvedFormatter(Number(item.value ?? 0))
                  : undefined
              }
            />
          }
          cursor={{ fill: "var(--muted)" }}
        />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        {categories.map((category) => (
          <Bar
            key={category}
            dataKey={category}
            fill={`var(--color-${category})`}
            radius={[6, 6, 0, 0]}
            stackId={stacked ? "stack" : undefined}
            maxBarSize={40}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  )
}

export { BarChart }
export type { BarChartProps }
