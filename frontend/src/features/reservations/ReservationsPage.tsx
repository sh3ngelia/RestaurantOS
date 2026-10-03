import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { CalendarPlus, CalendarX2, CircleAlert, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import type { Reservation } from '@/api/reservations'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { StatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useNow } from '@/hooks/useNow'
import { formatDay, formatTime, isDayKey, relativeDayLabel, toDayKey, todayKey } from '@/lib/dates'
import { DayNav } from './components/DayNav'
import { EditReservationDialog } from './components/EditReservationDialog'
import { NewReservationDialog } from './components/NewReservationDialog'
import { RescheduleDialog } from './components/RescheduleDialog'
import { ReservationTimeline } from './components/ReservationTimeline'
import { ReservationsSkeleton } from './components/ReservationsSkeleton'
import { notifyReservationError, useDayReservations, useReservationAction } from './hooks'
import { RESERVATION_ACTIONS } from './status'
import { summarizeDay } from './summary'

type DialogState = { open: boolean; reservation: Reservation | null }
const CLOSED: DialogState = { open: false, reservation: null }

export function ReservationsPage() {
  useDocumentTitle('Reservations')
  const now = useNow()
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('date')
  const dayKey = isDayKey(requested) ? requested : todayKey()
  const isToday = dayKey === toDayKey(now)
  const relative = relativeDayLabel(dayKey, toDayKey(now))

  const query = useDayReservations(dayKey)
  const reservations = query.data ?? []
  const summary = summarizeDay(reservations)
  const runAction = useReservationAction()

  // Dialog state keeps its subject while closing so exit animations don't flash empty content.
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<DialogState>(CLOSED)
  const [rescheduling, setRescheduling] = useState<DialogState>(CLOSED)
  const [cancelling, setCancelling] = useState<DialogState>(CLOSED)

  function goToDay(next: string) {
    setSearchParams(next === todayKey() ? {} : { date: next }, { replace: true, preventScrollReset: true })
  }

  /** After creating or moving a booking, follow it to its day. */
  function showBooking(reservation: Reservation) {
    const day = toDayKey(new Date(reservation.reservationTime))
    if (day !== dayKey) goToDay(day)
  }

  async function confirmCancel() {
    const reservation = cancelling.reservation
    if (!reservation) return
    try {
      await runAction.mutateAsync({ reservation, action: 'cancel' })
      toast.success(RESERVATION_ACTIONS.cancel.successTitle(reservation.guestName), {
        description: `${formatTime(new Date(reservation.reservationTime))} · table ${reservation.tableNumber}`,
      })
    } catch (error) {
      notifyReservationError(error, `Couldn't cancel ${reservation.guestName}'s booking`)
      if (!(error instanceof ApiError && error.status === 404)) throw error
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reservations"
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {formatDay(dayKey)}
            {relative && <StatusChip tone="neutral">{relative}</StatusChip>}
          </span>
        }
        actions={
          <Button onClick={() => setCreating(true)}>
            <CalendarPlus aria-hidden="true" />
            New reservation
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <DayNav dayKey={dayKey} onChange={goToDay} />
        {query.isSuccess && summary.bookings > 0 && (
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Day summary">
            <Stat label={summary.bookings === 1 ? 'booking' : 'bookings'} value={summary.bookings} />
            <Stat label="covers expected" value={summary.coversExpected} />
            <Stat label="arrived" value={summary.arrived} total={summary.active} />
          </dl>
        )}
      </div>

      {query.isPending ? (
        <ReservationsSkeleton />
      ) : query.isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn’t load reservations"
          description={getErrorMessage(query.error)}
          action={
            <Button variant="outline" onClick={() => void query.refetch()}>
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          }
        />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title={isToday ? 'No bookings today' : `No bookings for ${relative?.toLowerCase() ?? formatDay(dayKey)}`}
          action={
            dayKey >= toDayKey(now) && (
              <Button onClick={() => setCreating(true)}>
                <CalendarPlus aria-hidden="true" />
                New reservation
              </Button>
            )
          }
        />
      ) : (
        <ReservationTimeline
          reservations={reservations}
          now={now}
          isToday={isToday}
          onReschedule={(reservation) => setRescheduling({ open: true, reservation })}
          onEdit={(reservation) => setEditing({ open: true, reservation })}
          onCancel={(reservation) => setCancelling({ open: true, reservation })}
        />
      )}

      <NewReservationDialog open={creating} onOpenChange={setCreating} dayKey={dayKey} onCreated={showBooking} />
      <EditReservationDialog
        open={editing.open}
        onOpenChange={(open) => setEditing((s) => ({ ...s, open }))}
        reservation={editing.reservation}
      />
      <RescheduleDialog
        open={rescheduling.open}
        onOpenChange={(open) => setRescheduling((s) => ({ ...s, open }))}
        reservation={rescheduling.reservation}
        onRescheduled={showBooking}
      />
      {cancelling.reservation && (
        <ConfirmDialog
          open={cancelling.open}
          onOpenChange={(open) => setCancelling((s) => ({ ...s, open }))}
          title={`Cancel ${cancelling.reservation.guestName}'s booking?`}
          description={`${formatTime(new Date(cancelling.reservation.reservationTime))}, ${cancelling.reservation.guestCount} ${
            cancelling.reservation.guestCount === 1 ? 'guest' : 'guests'
          } at table ${cancelling.reservation.tableNumber}. A cancelled booking can't be reopened.`}
          confirmLabel="Cancel booking"
          onConfirm={confirmCancel}
        />
      )}
    </div>
  )
}

function Stat({ label, value, total }: { label: string; value: number; total?: number }) {
  // dt precedes dd in the DOM; row-reverse puts the number first visually.
  return (
    <div className="flex flex-row-reverse items-baseline justify-end gap-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">
        {value}
        {total !== undefined && <span className="font-normal text-muted-foreground"> / {total}</span>}
      </dd>
    </div>
  )
}
