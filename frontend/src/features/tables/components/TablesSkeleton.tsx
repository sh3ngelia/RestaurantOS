import { Skeleton } from '@/components/ui/skeleton'

export function TablesSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading the floor…</span>
      <div className="flex gap-2 overflow-hidden">
        {[16, 20, 22, 24].map((w, i) => (
          <Skeleton key={i} className="h-10 shrink-0 rounded-full" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="min-h-48 rounded-2xl border border-border bg-card p-5">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-10" />
                <Skeleton className="h-8 w-10" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mx-auto mt-5 h-16 w-3/4 rounded-xl" />
            <Skeleton className="mt-5 h-3.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
