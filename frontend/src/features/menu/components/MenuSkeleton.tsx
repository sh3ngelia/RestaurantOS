import { Skeleton } from '@/components/ui/skeleton'

export function MenuSkeleton() {
  return (
    <div role="status" aria-live="polite" className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10 xl:gap-12">
      <span className="sr-only">Loading the menu…</span>

      <div className="mb-8 flex gap-2 overflow-hidden lg:mb-0 lg:flex-col lg:gap-2 lg:px-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full lg:w-full lg:rounded-lg" />
        ))}
      </div>

      <div className="space-y-10">
        {[4, 2].map((count, group) => (
          <div key={group}>
            <div className="mb-4 flex items-end justify-between border-b border-border pb-3">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: count }, (_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex justify-between gap-4">
                    <Skeleton className="h-5 w-2/5" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                  <Skeleton className="mt-3 h-3.5 w-11/12" />
                  <Skeleton className="mt-2 h-3.5 w-3/5" />
                  <div className="mt-5 flex gap-2">
                    <Skeleton className="h-5 w-18 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
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
