import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton";

export default function HomeLoading() {
  return (
    <main>
      <div className="bg-primary py-32 sm:py-40" />
      <div className="mx-auto -mt-20 max-w-7xl px-4 sm:-mt-24 sm:px-6">
        <Skeleton className="mx-auto h-40 max-w-4xl rounded-2xl" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <CardGridSkeleton count={6} className="mt-8" />
      </div>
    </main>
  );
}
