import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardTrend {
  value: string
  direction: "up" | "down" | "flat"
  label?: string
}

interface MetricCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: MetricCardTrend
  className?: string
}

const TREND_TEXT_CLASS: Record<MetricCardTrend["direction"], string> = {
  up: "text-success",
  down: "text-destructive",
  flat: "text-muted-foreground",
}

function MetricCard({ label, value, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <Card className={cn("gap-3", className)}>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {trend && (
            <p
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                TREND_TEXT_CLASS[trend.direction]
              )}
            >
              {trend.direction === "up" && <ArrowUpRight className="size-3.5" />}
              {trend.direction === "down" && <ArrowDownRight className="size-3.5" />}
              <span>{trend.value}</span>
              {trend.label && (
                <span className="font-normal text-muted-foreground">{trend.label}</span>
              )}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { MetricCard }
export type { MetricCardProps, MetricCardTrend }
