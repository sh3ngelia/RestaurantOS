import { Skeleton } from '@/components/ui/skeleton'

export function MenuSkeleton() {
  return (
    <div role="status" aria-live="polite" className="lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-6">
      <span className="sr-only">Loading the menu…</span>

      <div className="mb-4 flex gap-1.5 overflow-hidden lg:mb-0 lg:flex-col lg:gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-24 shrink-0 lg:w-full" />
        ))}
      </div>

      <div className="space-y-6">
        {[4, 2].map((count, group) => (
          <div key={group}>
            <div className="mb-2 flex items-end justify-between border-b border-border pb-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: count }, (_, i) => (
                <div key={i} className="rounded-md border border-border bg-card p-3">
                  <div className="flex justify-between gap-4">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <Skeleton className="mt-2.5 h-3 w-11/12" />
                  <Skeleton className="mt-1.5 h-3 w-3/5" />
                  <div className="mt-3 flex gap-1.5">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
