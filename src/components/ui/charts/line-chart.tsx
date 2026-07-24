"use client"

import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts"
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
  valueFormatter?: (value: number) => string
}

function LineChart({
  data,
  index,
  categories,
  config,
  className,
  showLegend = categories.length > 1,
  valueFormatter,
}: LineChartProps) {
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
          tickFormatter={valueFormatter}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
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
