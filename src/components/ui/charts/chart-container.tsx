"use client"

import * as React from "react"
import { Legend, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"

type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    color?: string
  }
>

interface ChartContextValue {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("Chart subcomponents must be used within a <ChartContainer />")
  }
  return context
}

function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<typeof ResponsiveContainer>["children"]
}) {
  const colorVars = React.useMemo(() => {
    const entries = Object.entries(config).map(([key, value], index) => [
      `--color-${key}`,
      value.color ?? `var(--chart-${(index % 5) + 1})`,
    ])
    return Object.fromEntries(entries) as React.CSSProperties
  }, [config])

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        className={cn(
          "aspect-video w-full text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-cartesian-grid_line]:stroke-border/60",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
          "[&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden",
          "[&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-background",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted",
          className
        )}
        style={colorVars}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

interface ChartTooltipPayloadItem {
  dataKey?: string | number
  name?: string | number
  value?: number | string | Array<number | string>
  color?: string
  payload?: Record<string, unknown>
}

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = "dot",
  hideLabel = false,
  formatter,
}: {
  active?: boolean
  payload?: ChartTooltipPayloadItem[]
  label?: React.ReactNode
  className?: string
  indicator?: "dot" | "line"
  hideLabel?: boolean
  formatter?: (item: ChartTooltipPayloadItem, index: number) => React.ReactNode
}) {
  const { config } = useChart()

  if (!active || !payload?.length) return null

  return (
    <div
      className={cn(
        "grid min-w-36 gap-1.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md",
        className
      )}
    >
      {!hideLabel && label ? <p className="font-medium">{label}</p> : null}
      <div className="grid gap-1">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? item.name ?? index)
          const itemConfig = config[key]
          const color = item.color ?? `var(--color-${key})`
          return (
            <div key={key} className="flex w-full items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "shrink-0 rounded-xs",
                  indicator === "dot" ? "size-2 rounded-full" : "h-2.5 w-1"
                )}
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
              <span className="ms-auto font-mono font-medium text-foreground">
                {formatter ? formatter(item, index) : String(item.value ?? "")}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ChartLegendPayloadItem {
  dataKey?: string | number
  value?: string | number
  color?: string
}

function ChartLegendContent({ payload }: { payload?: ChartLegendPayloadItem[] }) {
  const { config } = useChart()
  if (!payload?.length) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
      {payload.map((item, index) => {
        const key = String(item.dataKey ?? item.value ?? index)
        const itemConfig = config[key]
        return (
          <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {itemConfig?.label ?? item.value}
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  Tooltip as ChartTooltip,
  ChartTooltipContent,
  Legend as ChartLegend,
  ChartLegendContent,
  useChart,
}
export type { ChartConfig, ChartTooltipPayloadItem, ChartLegendPayloadItem }
