import { Badge, type badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"

const TONE_DOT_CLASSES = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-primary",
  neutral: "bg-muted-foreground",
} as const

export type StatusTone = keyof typeof TONE_DOT_CLASSES

const TONE_BADGE_VARIANT: Record<
  StatusTone,
  NonNullable<VariantProps<typeof badgeVariants>["variant"]>
> = {
  success: "success",
  warning: "warning",
  destructive: "destructive",
  info: "default",
  neutral: "secondary",
}

function StatusBadge({
  tone,
  dot = true,
  className,
  children,
  ...props
}: {
  tone: StatusTone
  dot?: boolean
} & Omit<React.ComponentProps<typeof Badge>, "variant">) {
  return (
    <Badge
      variant={TONE_BADGE_VARIANT[tone]}
      className={cn("gap-1.5", className)}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT_CLASSES[tone])}
        />
      )}
      {children}
    </Badge>
  )
}

export { StatusBadge }
