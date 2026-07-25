"use client"

import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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

interface AreaChartProps {
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

function AreaChart({
  data,
  index,
  categories,
  config,
  className,
  showLegend = categories.length > 1,
  stacked = categories.length > 1,
  valueFormatter,
  currency,
  locale,
}: AreaChartProps) {
  const resolvedFormatter =
    currency && locale ? (value: number) => formatMoney(value, currency, locale) : valueFormatter
  return (
    <ChartContainer config={config} className={className}>
      <RechartsAreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {categories.map((category) => (
            <linearGradient key={category} id={`fill-${category}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`var(--color-${category})`} stopOpacity={0.35} />
              <stop offset="95%" stopColor={`var(--color-${category})`} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
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
        />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        {categories.map((category) => (
          <Area
            key={category}
            type="monotone"
            dataKey={category}
            stroke={`var(--color-${category})`}
            fill={`url(#fill-${category})`}
            strokeWidth={2}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </RechartsAreaChart>
    </ChartContainer>
  )
}

export { AreaChart }
export type { AreaChartProps }
