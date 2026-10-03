import { Skeleton } from '@/components/ui/skeleton'
import { TABLE_GRID } from '../floor'

export function TablesSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">Loading the floor…</span>
      <div className="flex gap-1.5 overflow-hidden">
        {[16, 20, 22, 24].map((w, i) => (
          <Skeleton key={i} className="h-8 shrink-0" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      <div className={TABLE_GRID}>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="min-h-40 rounded-md border border-border bg-card p-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="mx-auto mt-5 h-14 w-3/4" />
            <Skeleton className="mt-5 h-3.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
