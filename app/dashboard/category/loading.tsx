import { Skeleton } from "@/components/ui/skeleton"

export default function CategoryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-11 w-36" />
      </div>
      <Skeleton className="h-12 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
