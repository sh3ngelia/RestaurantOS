import type { TableStatus } from '@/api/tables'
import { StatusChip } from '@/components/StatusChip'
import { STATUS_LABELS, STATUS_TONES } from '../status'

export function StatusBadge({ status, className }: { status: TableStatus; className?: string }) {
  return (
    <StatusChip tone={STATUS_TONES[status]} dot className={className}>
      {STATUS_LABELS[status]}
    </StatusChip>
  )
}
