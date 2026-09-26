import type { TableStatus } from '@/api/tables'
import { cn } from '@/lib/utils'
import { STATUS_LABELS, STATUS_TONES } from '../status'

export function StatusBadge({ status, className }: { status: TableStatus; className?: string }) {
  const tone = STATUS_TONES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors duration-300',
        tone.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', tone.dot)} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  )
}
