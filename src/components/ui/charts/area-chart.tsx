"use client"

import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
  valueFormatter?: (value: number) => string
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
}: AreaChartProps) {
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
          tickFormatter={valueFormatter}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
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
