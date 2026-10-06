import type { Order } from '@/api/orders'
import { StatusChip } from '@/components/StatusChip'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SUMMARY_TONES, summarizeOrder, summaryParts } from '../rules'

/** "#A-1042 · 5 items · €48.00" */
export function OrderHeadline({ order, className }: { order: Order; className?: string }) {
  const { items } = summarizeOrder(order)
  return (
    <span className={cn('flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground tabular-nums', className)}>
      <span className="font-medium text-foreground">#{order.orderNumber}</span>
      <span aria-hidden="true">·</span>
      <span>
        {items} {items === 1 ? 'item' : 'items'}
      </span>
      <span aria-hidden="true">·</span>
      <span className="text-foreground">{formatPrice(order.totalAmount)}</span>
    </span>
  )
}

/**
 * Status counts, most urgent first: ready (the solid accent), then unsent (the warning tone).
 * Pass `now` to show how long a held course has been waiting.
 */
export function OrderStatusLine({ order, now, className }: { order: Order; now?: Date; className?: string }) {
  const parts = summaryParts(order, now)
  if (parts.length === 0) {
    return <span className={cn('block text-xs text-muted-foreground', className)}>Nothing on the ticket yet</span>
  }
  return (
    <span className={cn('flex flex-wrap items-center gap-1', className)}>
      {parts.map((part) => (
        <StatusChip key={part.key} tone={SUMMARY_TONES[part.key]}>
          {part.text}
        </StatusChip>
      ))}
    </span>
  )
}
