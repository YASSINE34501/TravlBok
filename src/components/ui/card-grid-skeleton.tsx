import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-2xl py-0">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <CardContent className="space-y-2 pb-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { CardGridSkeleton };
