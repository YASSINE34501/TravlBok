import { cn } from "@/lib/utils"

type TimelineTone = "primary" | "success" | "warning" | "destructive" | "neutral"

interface TimelineItem {
  id: string
  title: React.ReactNode
  description?: React.ReactNode
  timestamp?: React.ReactNode
  tone?: TimelineTone
}

const TONE_DOT_CLASS: Record<TimelineTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  neutral: "bg-muted-foreground",
}

function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-6 border-s ps-6", className)}>
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-1 -start-[1.6rem] flex size-3 rounded-full ring-4 ring-background",
              TONE_DOT_CLASS[item.tone ?? "neutral"]
            )}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm font-medium">{item.title}</p>
            {item.timestamp && (
              <time className="shrink-0 text-xs text-muted-foreground">{item.timestamp}</time>
            )}
          </div>
          {item.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
          )}
        </li>
      ))}
    </ol>
  )
}

export { Timeline }
export type { TimelineItem, TimelineTone }
