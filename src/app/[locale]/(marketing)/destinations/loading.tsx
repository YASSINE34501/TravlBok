import { Skeleton } from "@/components/ui/skeleton";

export default function DestinationsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Skeleton className="h-9 w-64" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
