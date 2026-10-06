import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CalendarClock, Lock, LoaderCircle, UserPlus } from 'lucide-react'

import type { DiningTable } from '@/api/tables'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { StatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/features/tables/components/StatusBadge'
import { floorStateOf } from '@/features/tables/status'
import { formatTime } from '@/lib/dates'
import { notifyOrderError, useStartOrder } from '../hooks'

/**
 * A table nobody is sitting at. "Seat and start order" opens an order, which seats the table in
 * the same request: the waiter's way to seat a walk-in. A booking due soon asks first.
 */
export function FreeTableCard({ table }: { table: DiningTable }) {
  const start = useStartOrder()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const state = floorStateOf(table)
  const next = table.nextReservation
  // "booked": Reserved because a confirmed booking is due within 45 minutes or running late.
  const booked = state === 'booked' && next !== null
  const seats = `${table.capacity} ${table.capacity === 1 ? 'seat' : 'seats'}`

  function seat() {
    // mutateAsync, not mutate callbacks: storing the new order replaces this card with the
    // open-order card, unmounting it, and per-call callbacks don't run after unmount.
    return start.mutateAsync(table.id).then(
      (order) => navigate(`/m/orders/${order.id}`),
      (error: unknown) => {
        notifyOrderError(error, `Couldn't seat table ${table.tableNumber}`)
        throw error
      },
    )
  }

  return (
    <div className="flex h-full min-h-36 flex-col rounded-md border border-border bg-card/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-base leading-tight font-semibold tabular-nums">Table {table.tableNumber}</p>
        <StatusBadge status={table.status} />
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">{seats}</p>

      {state === 'held' && (
        <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-status-waiting">
          <Lock className="size-3.5" aria-hidden="true" />
          Held
        </p>
      )}
      {next && (
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-status-waiting">
          <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate tabular-nums">
            {booked ? '' : 'Next: '}
            {next.guestName} · {next.guestCount} · {formatTime(new Date(next.reservationTime))}
          </span>
          {next.isLate && (
            <StatusChip tone="attention" className="shrink-0">
              Late
            </StatusChip>
          )}
        </p>
      )}

      <div className="mt-auto pt-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => (booked ? setConfirming(true) : void seat().catch(() => {}))}
          disabled={start.isPending}
          aria-busy={start.isPending}
        >
          {start.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
          Seat and start order
        </Button>
      </div>

      {booked && next && (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={`Seat a walk-in at table ${table.tableNumber}?`}
          description={`${next.guestName} (party of ${next.guestCount}) is booked here for ${formatTime(new Date(next.reservationTime))}${
            next.isLate ? ' and is running late' : ''
          }. Seating a walk-in now may leave them without a table.`}
          confirmLabel="Seat walk-in"
          confirmVariant="default"
          onConfirm={seat}
        />
      )}
    </div>
  )
}
