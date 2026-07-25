import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton";

export default function DealsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-2 h-4 w-80" />
      <CardGridSkeleton count={9} className="mt-8" />
    </main>
  );
}
