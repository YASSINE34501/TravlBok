import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  basePath,
  total,
  page,
  pageSize,
  extraParams,
}: {
  basePath: string;
  total: number;
  page: number;
  pageSize: number;
  extraParams?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(extraParams ?? {})) {
      if (value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        disabled={page <= 1}
        render={<Link href={buildHref(Math.max(1, page - 1))} />}
      >
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </Button>
      <span className="px-3 text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        disabled={page >= totalPages}
        render={<Link href={buildHref(Math.min(totalPages, page + 1))} />}
      >
        <ChevronRight className="size-4 rtl:rotate-180" />
      </Button>
    </div>
  );
}
