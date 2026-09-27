import { useId, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTables } from '@/features/tables/hooks'
import { useFormState } from '@/hooks/useFormState'
import { useNow } from '@/hooks/useNow'
import { formatShortDay, formatTime, toDayKey } from '@/lib/dates'
import { fieldDescribedBy, focusById } from '@/lib/forms'
import { useCreateReservation } from '../hooks'
import {
  CREATE_FIELDS,
  RESERVATION_LIMITS,
  defaultDateTime,
  toCreateInput,
  validateCreate,
  type CreateField,
  type CreateValues,
} from '../validation'
import { DateTimeFields } from './DateTimeFields'
import { PartySizeField } from './PartySizeField'

interface NewReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The day being viewed; the form starts there when it isn't in the past. */
  dayKey: string
  onCreated: (reservation: Reservation) => void
}

export function NewReservationDialog({ open, onOpenChange, dayKey, onCreated }: NewReservationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Close reservation form" className="max-w-xl">
        <NewReservationForm dayKey={dayKey} onCreated={onCreated} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function NewReservationForm({
  dayKey,
  onCreated,
  onDone,
}: {
  dayKey: string
  onCreated: (reservation: Reservation) => void
  onDone: () => void
}) {
  const baseId = useId()
  const id = (field: CreateField) => `${baseId}-${field}`
  const formErrorId = `${baseId}-form-error`
  const now = useNow()
  const tablesQuery = useTables()
  const tables = tablesQuery.data ?? []
  const create = useCreateReservation()

  const form = useFormState<CreateField, CreateValues>({
    initialValues: {
      ...defaultDateTime(dayKey, new Date()),
      guestCount: '2',
      tableId: '',
      guestName: '',
      guestPhoneNumber: '',
      notes: '',
    },
    fields: CREATE_FIELDS,
    validate: (values) => validateCreate(values, now, tables),
    aliases: { ReservationTime: 'time' },
  })
  const { values } = form

  const partySize = Number(values.guestCount)
  const partyValid = Number.isInteger(partySize) && partySize >= 1
  // Only tables that can seat the party, smallest fit first.
  const fittingTables = partyValid
    ? tables.filter((t) => t.capacity >= partySize).sort((a, b) => a.capacity - b.capacity || a.tableNumber - b.tableNumber)
    : []

  function changePartySize(value: string) {
    form.setValue('guestCount', value)
    const count = Number(value)
    const selected = tables.find((t) => t.id === values.tableId)
    // Drop a table that no longer fits rather than keep an invalid choice.
    if (selected && Number.isInteger(count) && selected.capacity < count) form.setValue('tableId', '')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (create.isPending) return
    const invalid = form.beginSubmit()
    if (invalid) {
      focusById(id(invalid))
      return
    }

    create.mutate(toCreateInput(values), {
      onSuccess: (created) => {
        const at = new Date(created.reservationTime)
        toast.success(`Booked: ${created.guestName}, ${created.guestCount} ${created.guestCount === 1 ? 'guest' : 'guests'}`, {
          description: `${formatShortDay(toDayKey(at))} · ${formatTime(at)} · table ${created.tableNumber}`,
        })
        onCreated(created)
        onDone()
      },
      onError: (error) => {
        const field = form.applyServerError(error)
        focusById(field ? id(field) : formErrorId)
      },
    })
  }

  let tablePlaceholder = 'Choose a table'
  if (tablesQuery.isPending) tablePlaceholder = 'Loading tables…'
  else if (tablesQuery.isError) tablePlaceholder = 'Tables unavailable'
  else if (!partyValid) tablePlaceholder = 'Set the party size first'
  else if (fittingTables.length === 0) tablePlaceholder = `No table seats ${partySize}`

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-5" aria-busy={create.isPending}>
      <DialogHeader>
        <DialogTitle>New reservation</DialogTitle>
        <DialogDescription>Bookings taken by staff are confirmed straight away.</DialogDescription>
      </DialogHeader>

      <div tabIndex={-1} id={formErrorId} className="outline-none">
        <FormAlert message={form.formError} />
      </div>

      <DateTimeFields
        dateId={id('date')}
        timeId={id('time')}
        date={values.date}
        time={values.time}
        now={now}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <PartySizeField
          id={id('guestCount')}
          value={values.guestCount}
          onChange={changePartySize}
          onBlur={() => form.touch('guestCount')}
          error={form.errorFor('guestCount')}
        />

        <FormField id={id('tableId')} label="Table" error={form.errorFor('tableId')}>
          <Select
            value={values.tableId}
            onValueChange={(value) => {
              form.setValue('tableId', value)
              form.touch('tableId')
            }}
            disabled={fittingTables.length === 0}
          >
            <SelectTrigger
              id={id('tableId')}
              className="h-12"
              aria-invalid={!!form.errorFor('tableId')}
              aria-describedby={fieldDescribedBy(id('tableId'), { error: form.errorFor('tableId') })}
            >
              <SelectValue placeholder={tablePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {fittingTables.map((table) => (
                <SelectItem key={table.id} value={table.id}>
                  <span className="tabular-nums">Table {table.tableNumber}</span>
                  <span className="ml-2 text-muted-foreground">
                    seats {table.capacity}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={id('guestName')} label="Guest name" error={form.errorFor('guestName')}>
          <Input
            id={id('guestName')}
            value={values.guestName}
            onChange={(e) => form.setValue('guestName', e.target.value)}
            onBlur={() => form.touch('guestName')}
            autoComplete="off"
            placeholder="e.g. Nino Beridze"
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
            placeholder="+995 555 12 34 56"
            className="h-12 tabular-nums"
            aria-invalid={!!form.errorFor('guestPhoneNumber')}
            aria-describedby={fieldDescribedBy(id('guestPhoneNumber'), { error: form.errorFor('guestPhoneNumber') })}
          />
        </FormField>
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
          placeholder="Allergies, occasion, seating preference."
          aria-invalid={!!form.errorFor('notes')}
          aria-describedby={fieldDescribedBy(id('notes'), { error: form.errorFor('notes') })}
        />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={create.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={create.isPending} aria-busy={create.isPending}>
          {create.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          Book table
        </Button>
      </DialogFooter>
    </form>
  )
}
