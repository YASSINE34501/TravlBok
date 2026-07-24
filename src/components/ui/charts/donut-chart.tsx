"use client"

import { Cell, Pie, PieChart as RechartsPieChart } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/charts/chart-container"
import { cn } from "@/lib/utils"

interface DonutChartDatum {
  name: string
  value: number
  color?: string
}

interface DonutChartProps {
  data: DonutChartDatum[]
  config: ChartConfig
  className?: string
  centerLabel?: React.ReactNode
  showLegend?: boolean
}

function DonutChart({ data, config, className, centerLabel, showLegend = true }: DonutChartProps) {
  return (
    <ChartContainer config={config} className={cn("relative", className)}>
      <RechartsPieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="62%"
          outerRadius="100%"
          strokeWidth={2}
          stroke="var(--background)"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={entry.color ?? `var(--color-${entry.name}, var(--chart-${(index % 5) + 1}))`}
            />
          ))}
        </Pie>
      </RechartsPieChart>
      {centerLabel && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {centerLabel}
        </div>
      )}
    </ChartContainer>
  )
}

export { DonutChart }
export type { DonutChartDatum, DonutChartProps }
