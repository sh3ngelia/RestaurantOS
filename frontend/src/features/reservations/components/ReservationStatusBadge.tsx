import type { ReservationStatus } from '@/api/reservations'
import { StatusChip } from '@/components/StatusChip'
import { STATUS_LABELS, STATUS_TONES } from '../status'

export function ReservationStatusBadge({ status, className }: { status: ReservationStatus; className?: string }) {
  return (
    <StatusChip tone={STATUS_TONES[status]} dot dashed={status === 'Pending'} className={className}>
      {STATUS_LABELS[status]}
    </StatusChip>
  )
}
