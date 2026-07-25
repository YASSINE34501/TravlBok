"use client"

import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts"
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

interface LineChartProps {
  data: Array<Record<string, unknown>>
  index: string
  categories: string[]
  config: ChartConfig
  className?: string
  showLegend?: boolean
  /** Only safe to pass from a Client Component — a plain function prop from a
   * Server Component is not serializable. Server Components should pass
   * `currency`/`locale` instead, which build the formatter internally. */
  valueFormatter?: (value: number) => string
  /** Formats values as money client-side — the server-safe alternative to
   * `valueFormatter` when this chart is rendered from a Server Component. */
  currency?: CurrencyCode
  locale?: string
}

function LineChart({
  data,
  index,
  categories,
  config,
  className,
  showLegend = categories.length > 1,
  valueFormatter,
  currency,
  locale,
}: LineChartProps) {
  const resolvedFormatter =
    currency && locale ? (value: number) => formatMoney(value, currency, locale) : valueFormatter
  return (
    <ChartContainer config={config} className={className}>
      <RechartsLineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={`var(--color-${category})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  )
}

export { LineChart }
export type { LineChartProps }
