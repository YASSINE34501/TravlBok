import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleDetailLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="mt-3 h-4 w-40" />
      <Skeleton className="mt-6 aspect-[16/9] w-full rounded-2xl" />
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </main>
  );
}
