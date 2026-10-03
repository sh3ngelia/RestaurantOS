import type { Order } from '@/api/orders'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { summarizeOrder, summaryParts } from '../rules'

/** "#A-1042 · 5 items · €48.00" */
export function OrderHeadline({ order, className }: { order: Order; className?: string }) {
  const { items } = summarizeOrder(order)
  return (
    <span className={cn('flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground tabular-nums', className)}>
      <span className="font-mono text-xs tracking-wide text-foreground">#{order.orderNumber}</span>
      <span aria-hidden="true">·</span>
      <span>
        {items} {items === 1 ? 'item' : 'items'}
      </span>
      <span aria-hidden="true">·</span>
      <span className="text-foreground">{formatPrice(order.totalAmount)}</span>
    </span>
  )
}

/** Status counts, most urgent first. Ready is a solid copper chip with a live dot. */
export function OrderStatusLine({ order, className }: { order: Order; className?: string }) {
  const parts = summaryParts(summarizeOrder(order))
  if (parts.length === 0) {
    return <span className={cn('block text-xs text-muted-foreground', className)}>Nothing on the ticket yet</span>
  }
  return (
    <span className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {parts.map((part) =>
        part.key === 'ready' ? (
          <span
            key={part.key}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground"
          >
            <span className="relative flex size-1.5" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary-foreground" />
            </span>
            {part.text}
          </span>
        ) : (
          <span
            key={part.key}
            className={cn(
              'rounded-full border px-2 py-px text-xs',
              part.key === 'held' ? 'border-reserved/35 text-reserved' : 'border-border-strong text-muted-foreground',
            )}
          >
            {part.text}
          </span>
        ),
      )}
    </span>
  )
}
