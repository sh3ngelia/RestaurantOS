import type { OrderItemStatus } from '@/api/orders'
import { cn } from '@/lib/utils'
import { ITEM_STATUS_LABELS, ITEM_STATUS_TONES } from '../rules'

export function ItemStatusChip({ status, className }: { status: OrderItemStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-px text-[11px] leading-4 font-medium whitespace-nowrap transition-colors duration-300',
        ITEM_STATUS_TONES[status],
        className,
      )}
    >
      {ITEM_STATUS_LABELS[status]}
    </span>
  )
}
