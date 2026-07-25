import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton";

export default function HotelsSearchLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-56" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
        <Skeleton className="h-96 rounded-2xl" />
        <CardGridSkeleton count={6} />
      </div>
    </main>
  );
}
