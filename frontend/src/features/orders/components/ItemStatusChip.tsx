import type { OrderItemStatus } from '@/api/orders'
import { StatusChip } from '@/components/StatusChip'
import { cn } from '@/lib/utils'
import { ITEM_STATUS_LABELS, ITEM_STATUS_TONES } from '../rules'

export function ItemStatusChip({ status, className }: { status: OrderItemStatus; className?: string }) {
  return (
    <StatusChip
      tone={ITEM_STATUS_TONES[status]}
      dashed={status === 'Draft'}
      className={cn(status === 'Cancelled' && 'line-through', className)}
    >
      {ITEM_STATUS_LABELS[status]}
    </StatusChip>
  )
}
