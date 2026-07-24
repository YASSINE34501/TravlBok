import { ChevronLeft, ChevronRight, MoreHorizontal, Search } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DataTableShellProps {
  title?: React.ReactNode
  description?: React.ReactNode
  toolbar?: React.ReactNode
  actions?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

function DataTableShell({
  title,
  description,
  toolbar,
  actions,
  footer,
  children,
  className,
}: DataTableShellProps) {
  const hasHeader = Boolean(title || description || actions || toolbar)
  return (
    <Card className={cn("gap-0 p-0", className)}>
      {hasHeader && (
        <div className="flex flex-col gap-4 border-b p-4 sm:p-5">
          {(title || description || actions) && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {title && <h2 className="text-base font-semibold">{title}</h2>}
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
      {footer && <div className="border-t p-4 sm:p-5">{footer}</div>}
    </Card>
  )
}

function DataTableSearch({
  name = "q",
  placeholder,
  defaultValue,
  children,
  className,
}: {
  name?: string
  placeholder?: string
  defaultValue?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <form className={cn("relative max-w-sm", className)} role="search">
      {children}
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-9 ps-9"
      />
    </form>
  )
}

function buildPageHref(
  basePath: string,
  page: number,
  extraParams?: Record<string, string | undefined>
) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(extraParams ?? {})) {
    if (value) params.set(key, value)
  }
  params.set("page", String(page))
  return `${basePath}?${params.toString()}`
}

function getPageWindow(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const keep = new Set([1, total, current, current - 1, current + 1])
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const withEllipsis: Array<number | "ellipsis"> = []
  let previous = 0
  for (const p of sorted) {
    if (previous && p - previous > 1) withEllipsis.push("ellipsis")
    withEllipsis.push(p)
    previous = p
  }
  return withEllipsis
}

interface DataTablePaginationProps {
  basePath: string
  page: number
  pageSize: number
  total: number
  extraParams?: Record<string, string | undefined>
  itemLabel?: string
  className?: string
}

function DataTablePagination({
  basePath,
  page,
  pageSize,
  total,
  extraParams,
  itemLabel = "results",
  className,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className={cn("flex flex-col items-center justify-between gap-3 sm:flex-row", className)}>
      <p className="text-sm text-muted-foreground">
        {total.toLocaleString()} {itemLabel}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            aria-label="Previous page"
            render={<Link href={buildPageHref(basePath, Math.max(1, page - 1), extraParams)} />}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
          {getPageWindow(page, totalPages).map((p, i) =>
            p === "ellipsis" ? (
              <span
                key={`ellipsis-${i}`}
                className="flex size-7 items-center justify-center text-muted-foreground"
              >
                <MoreHorizontal className="size-4" />
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "outline" : "ghost"}
                size="icon-sm"
                aria-current={p === page ? "page" : undefined}
                render={<Link href={buildPageHref(basePath, p, extraParams)} />}
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages}
            aria-label="Next page"
            render={<Link href={buildPageHref(basePath, Math.min(totalPages, page + 1), extraParams)} />}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      )}
    </div>
  )
}

export { DataTableShell, DataTableSearch, DataTablePagination }
export type { DataTableShellProps, DataTablePaginationProps }
