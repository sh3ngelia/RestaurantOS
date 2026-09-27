import { useId, type FormEvent } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError } from '@/api/errors'
import type { Reservation } from '@/api/reservations'
import { FormAlert } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFormState } from '@/hooks/useFormState'
import { useNow } from '@/hooks/useNow'
import { combineLocal, formatShortDay, formatTime, isDayKey, toDayKey } from '@/lib/dates'
import { focusById } from '@/lib/forms'
import { notifyReservationError, useReschedule } from '../hooks'
import {
  RESCHEDULE_FIELDS,
  rescheduleValues,
  validateReschedule,
  type RescheduleField,
  type RescheduleValues,
} from '../validation'
import { DateTimeFields } from './DateTimeFields'

interface RescheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservation: Reservation | null
  onRescheduled: (reservation: Reservation) => void
}

export function RescheduleDialog({ open, onOpenChange, reservation, onRescheduled }: RescheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Close reschedule form" className="max-w-md">
        {reservation && (
          <RescheduleForm reservation={reservation} onRescheduled={onRescheduled} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function RescheduleForm({
  reservation,
  onRescheduled,
  onDone,
}: {
  reservation: Reservation
  onRescheduled: (reservation: Reservation) => void
  onDone: () => void
}) {
  const baseId = useId()
  const id = (field: RescheduleField) => `${baseId}-${field}`
  const formErrorId = `${baseId}-form-error`
  const now = useNow()
  const reschedule = useReschedule()

  const original = rescheduleValues(reservation)
  const originalAt = new Date(reservation.reservationTime)
  const form = useFormState<RescheduleField, RescheduleValues>({
    initialValues: original,
    fields: RESCHEDULE_FIELDS,
    validate: (values) => validateReschedule(values, now),
    aliases: { ReservationTime: 'time' },
  })
  const { values } = form
  // Keep the current slot selectable on its own day while it's still in the future.
  const keepTime = values.date === original.date && originalAt > now ? original.time : undefined
  const unchanged = values.date === original.date && values.time === original.time
  const target = isDayKey(values.date) && /^\d{2}:\d{2}$/.test(values.time) ? combineLocal(values.date, values.time) : null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (reschedule.isPending || unchanged) return
    const invalid = form.beginSubmit()
    if (invalid || !target) {
      focusById(id(invalid ?? 'time'))
      return
    }

    reschedule.mutate(
      { id: reservation.id, reservationTime: target.toISOString() },
      {
        onSuccess: (moved) => {
          const at = new Date(moved.reservationTime)
          toast.success(`${moved.guestName} moved to ${formatTime(at)}`, {
            description: `${formatShortDay(toDayKey(at))} · table ${moved.tableNumber}`,
          })
          onRescheduled(moved)
          onDone()
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 404) {
            notifyReservationError(error, "Couldn't reschedule")
            onDone()
            return
          }
          // 409 "Table 5 is already booked around that time." lands in the form alert.
          const field = form.applyServerError(error)
          focusById(field ? id(field) : formErrorId)
        },
      },
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-5" aria-busy={reschedule.isPending}>
      <DialogHeader>
        <DialogTitle>Reschedule</DialogTitle>
        <DialogDescription>
          {reservation.guestName}, {reservation.guestCount} {reservation.guestCount === 1 ? 'guest' : 'guests'} at table{' '}
          {reservation.tableNumber}.
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-sunken/60 px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          {formatShortDay(original.date)} · <span className="tabular-nums">{formatTime(originalAt)}</span>
        </span>
        <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">
          {target && !unchanged ? (
            <>
              {formatShortDay(values.date)} · <span className="tabular-nums">{values.time}</span>
            </>
          ) : (
            'Pick a new time'
          )}
        </span>
      </div>

      <div tabIndex={-1} id={formErrorId} className="outline-none">
        <FormAlert message={form.formError} />
      </div>

      <DateTimeFields
        dateId={id('date')}
        timeId={id('time')}
        date={values.date}
        time={values.time}
        now={now}
        keepTime={keepTime}
        onDateChange={(date, slots) => {
          form.setValue('date', date)
          if (!slots.includes(values.time)) form.setValue('time', slots[0] ?? '')
        }}
        onDateBlur={() => form.touch('date')}
        onTimeChange={(time) => {
          form.setValue('time', time)
          form.touch('time')
        }}
        dateError={form.errorFor('date')}
        timeError={form.errorFor('time')}
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={reschedule.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={reschedule.isPending || unchanged} aria-busy={reschedule.isPending}>
          {reschedule.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          Move booking
        </Button>
      </DialogFooter>
    </form>
  )
}
