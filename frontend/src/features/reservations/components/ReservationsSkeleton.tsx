import { Skeleton } from '@/components/ui/skeleton'

export function ReservationsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="divide-y divide-border rounded-md border border-border bg-card">
      <span className="sr-only">Loading reservations…</span>
      {[2, 3].map((count, group) => (
        <div key={group} className="divide-y divide-border">
          <div className="bg-sunken px-3 py-2">
            <Skeleton className="h-3 w-10" />
          </div>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-3 py-3">
              <Skeleton className="h-4 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-64 max-w-full" />
              </div>
              <Skeleton className="h-8 w-28" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
