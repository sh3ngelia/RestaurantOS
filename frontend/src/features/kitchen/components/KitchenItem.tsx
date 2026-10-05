import { LoaderCircle, TriangleAlert } from 'lucide-react'

import type { KitchenTicketItem } from '@/api/kitchen'
import { StatusChip } from '@/components/StatusChip'
import { STATUS_TONE_CLASSES } from '@/lib/status-tones'
import { cn } from '@/lib/utils'
import { KITCHEN_STATUS_LABELS, KITCHEN_STATUS_TONES } from '../rules'

/** Allergens as large text tags in the warning colour, with a sentence for screen readers. */
export function KitchenAllergens({ item }: { item: KitchenTicketItem }) {
  if (item.allergens.length === 0) return null
  return (
    <p className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="sr-only">Allergens: {item.allergens.join(', ')}.</span>
      <TriangleAlert className="size-5 shrink-0 text-status-danger" aria-hidden="true" />
      {item.allergens.map((allergen) => (
        <span
          key={allergen}
          aria-hidden="true"
          className={cn('rounded-sm border px-2 py-0.5 text-sm leading-5 font-semibold', STATUS_TONE_CLASSES.danger.chip)}
        >
          {allergen}
        </span>
      ))}
    </p>
  )
}

interface KitchenItemProps {
  item: KitchenTicketItem
  /** Pass screen: show which station makes it, and its status. */
  showStation?: boolean
  /** What a tap does ("Start", "Ready"), or undefined for a read-only line. */
  actionLabel?: string
  onAction?: () => void
  /** A request for this item is in flight; taps are ignored until it settles. */
  busy?: boolean
}

/** One line on a ticket. The whole line is the tap target on a wall-mounted touch screen. */
export function KitchenItem({ item, showStation = false, actionLabel, onAction, busy = false }: KitchenItemProps) {
  const statusLabel = KITCHEN_STATUS_LABELS[item.status]
  const tone = KITCHEN_STATUS_TONES[item.status] ?? 'neutral'
  const ready = item.status === 'Ready'

  const body = (
    <>
      <span className="w-10 shrink-0 text-2xl leading-7 font-bold tabular-nums">{item.quantity}×</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xl leading-7 font-semibold break-words">{item.name}</span>
        {(item.seatNumber !== null || item.notes || showStation) && (
          <span className="mt-0.5 block text-base text-foreground/85">
            {showStation && <span className="text-muted-foreground">{item.stationName}</span>}
            {showStation && (item.seatNumber !== null || item.notes) && <span aria-hidden="true"> · </span>}
            {item.seatNumber !== null && <span className="font-medium">Seat {item.seatNumber}</span>}
            {item.seatNumber !== null && item.notes && <span aria-hidden="true"> · </span>}
            {item.notes && <span className="font-medium">{item.notes}</span>}
          </span>
        )}
        <KitchenAllergens item={item} />
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        {statusLabel && (showStation || item.status === 'InProgress') && (
          <StatusChip tone={tone} className="h-6 px-2 text-sm">
            {statusLabel}
          </StatusChip>
        )}
        {actionLabel && (
          <span
            aria-hidden="true"
            className={cn(
              'inline-flex h-10 min-w-20 items-center justify-center gap-1.5 rounded-md border px-3 text-base font-semibold',
              actionLabel === 'Start' ? 'border-border-strong text-foreground' : 'border-status-active bg-status-active text-background',
            )}
          >
            {busy && <LoaderCircle className="size-4 animate-spin" />}
            {actionLabel}
          </span>
        )}
      </span>
    </>
  )

  const lineClass = cn(
    'flex w-full items-start gap-3 px-4 py-3 text-left',
    item.status === 'InProgress' && 'bg-status-active/5',
    ready && 'bg-status-attention/8',
  )

  if (!actionLabel || !onAction) return <div className={lineClass}>{body}</div>

  return (
    <button
      type="button"
      onClick={onAction}
      disabled={busy}
      aria-busy={busy}
      aria-label={`${item.quantity} ${item.name}${item.seatNumber !== null ? `, seat ${item.seatNumber}` : ''}${
        item.allergens.length ? `, contains ${item.allergens.join(', ')}` : ''
      }${statusLabel ? `, ${statusLabel.toLowerCase()}` : ''}. ${actionLabel}`}
      className={cn(
        lineClass,
        'min-h-16 outline-none transition-colors duration-150 hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        'disabled:cursor-wait',
      )}
    >
      {body}
    </button>
  )
}
