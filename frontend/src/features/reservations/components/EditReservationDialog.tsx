import { useId, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError } from '@/api/errors'
import type { Reservation } from '@/api/reservations'
import { FormAlert, FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTables } from '@/features/tables/hooks'
import { useFormState } from '@/hooks/useFormState'
import { formatTime } from '@/lib/dates'
import { fieldDescribedBy, focusById } from '@/lib/forms'
import { notifyReservationError, useUpdateGuestInfo } from '../hooks'
import {
  EDIT_FIELDS,
  RESERVATION_LIMITS,
  editValues,
  toEditInput,
  validateEdit,
  type EditField,
  type EditValues,
} from '../validation'
import { PartySizeField } from './PartySizeField'

interface EditReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservation: Reservation | null
}

export function EditReservationDialog({ open, onOpenChange, reservation }: EditReservationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Close edit form" className="max-w-xl">
        {reservation && <EditForm reservation={reservation} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function EditForm({ reservation, onDone }: { reservation: Reservation; onDone: () => void }) {
  const baseId = useId()
  const id = (field: EditField) => `${baseId}-${field}`
  const formErrorId = `${baseId}-form-error`
  const tables = useTables().data
  const capacity = tables?.find((t) => t.id === reservation.tableId)?.capacity
  const update = useUpdateGuestInfo()

  const form = useFormState<EditField, EditValues>({
    initialValues: editValues(reservation),
    fields: EDIT_FIELDS,
    validate: (values) => validateEdit(values, capacity),
  })
  const { values } = form

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (update.isPending) return
    const invalid = form.beginSubmit()
    if (invalid) {
      focusById(id(invalid))
      return
    }

    update.mutate(
      { id: reservation.id, input: toEditInput(values) },
      {
        onSuccess: (saved) => {
          toast.success('Booking updated', {
            description: `${saved.guestName} · ${saved.guestCount} ${saved.guestCount === 1 ? 'guest' : 'guests'}`,
          })
          onDone()
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 404) {
            notifyReservationError(error, "Couldn't update the booking")
            onDone()
            return
          }
          const field = form.applyServerError(error)
          focusById(field ? id(field) : formErrorId)
        },
      },
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-5" aria-busy={update.isPending}>
      <DialogHeader>
        <DialogTitle>Edit booking</DialogTitle>
        <DialogDescription>
          {formatTime(new Date(reservation.reservationTime))} at table {reservation.tableNumber}
          {capacity !== undefined && ` (seats ${capacity})`}. To change the time, use Reschedule.
        </DialogDescription>
      </DialogHeader>

      <div tabIndex={-1} id={formErrorId} className="outline-none">
        <FormAlert message={form.formError} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={id('guestName')} label="Guest name" error={form.errorFor('guestName')}>
          <Input
            id={id('guestName')}
            value={values.guestName}
            onChange={(e) => form.setValue('guestName', e.target.value)}
            onBlur={() => form.touch('guestName')}
            autoComplete="off"
            className="h-12"
            aria-invalid={!!form.errorFor('guestName')}
            aria-describedby={fieldDescribedBy(id('guestName'), { error: form.errorFor('guestName') })}
          />
        </FormField>

        <FormField id={id('guestPhoneNumber')} label="Phone" error={form.errorFor('guestPhoneNumber')}>
          <Input
            id={id('guestPhoneNumber')}
            type="tel"
            inputMode="tel"
            value={values.guestPhoneNumber}
            onChange={(e) => form.setValue('guestPhoneNumber', e.target.value)}
            onBlur={() => form.touch('guestPhoneNumber')}
            autoComplete="off"
            className="h-12 tabular-nums"
            aria-invalid={!!form.errorFor('guestPhoneNumber')}
            aria-describedby={fieldDescribedBy(id('guestPhoneNumber'), { error: form.errorFor('guestPhoneNumber') })}
          />
        </FormField>
      </div>

      <div className="sm:max-w-[calc(50%-0.5rem)]">
        <PartySizeField
          id={id('guestCount')}
          value={values.guestCount}
          onChange={(value) => form.setValue('guestCount', value)}
          onBlur={() => form.touch('guestCount')}
          error={form.errorFor('guestCount')}
        />
      </div>

      <FormField
        id={id('notes')}
        label="Notes"
        aside={values.notes.length > RESERVATION_LIMITS.notes * 0.8 ? `${values.notes.trim().length}/${RESERVATION_LIMITS.notes}` : 'Optional'}
        error={form.errorFor('notes')}
      >
        <Textarea
          id={id('notes')}
          value={values.notes}
          onChange={(e) => form.setValue('notes', e.target.value)}
          onBlur={() => form.touch('notes')}
          rows={2}
          className="min-h-18"
          aria-invalid={!!form.errorFor('notes')}
          aria-describedby={fieldDescribedBy(id('notes'), { error: form.errorFor('notes') })}
        />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={update.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={update.isPending} aria-busy={update.isPending}>
          {update.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          Save changes
        </Button>
      </DialogFooter>
    </form>
  )
}
