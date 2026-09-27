import { Skeleton } from '@/components/ui/skeleton'

export function ReservationsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-8">
      <span className="sr-only">Loading the book…</span>
      {[2, 3].map((count, group) => (
        <div key={group} className="grid gap-3 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-5">
          <Skeleton className="h-4 w-12" />
          <div className="space-y-3">
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:gap-5">
                <Skeleton className="h-7 w-14" />
                <div className="flex-1 space-y-2.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3.5 w-64 max-w-full" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
