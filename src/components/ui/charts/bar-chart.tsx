"use client"

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
  valueFormatter?: (value: number) => string
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
}: BarChartProps) {
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
          tickFormatter={valueFormatter}
        />
        <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)" }} />
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
