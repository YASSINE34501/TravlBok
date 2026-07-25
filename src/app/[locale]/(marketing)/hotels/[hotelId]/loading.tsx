import { Skeleton } from "@/components/ui/skeleton";

export default function HotelDetailLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="mt-3 h-4 w-40" />
      <div className="mt-6 grid grid-cols-4 gap-2">
        <Skeleton className="col-span-4 aspect-[16/9] rounded-2xl sm:col-span-2 sm:row-span-2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="hidden aspect-square sm:block" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
