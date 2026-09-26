import { useId, type FormEvent } from 'react'
import { LoaderCircle, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError } from '@/api/errors'
import type { DiningTable } from '@/api/tables'
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
import { useFormState } from '@/hooks/useFormState'
import { fieldDescribedBy, focusById } from '@/lib/forms'
import { notifyTableError, useSaveTable } from '../hooks'
import { TABLE_FIELDS, TABLE_LIMITS, tableFormValues, toTableInput, validateTable, type TableField } from '../validation'
import { TableShape } from './TableShape'

interface TableFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null → add a new table. */
  table: DiningTable | null
  nextTableNumber: number
}

export function TableFormDialog({ open, onOpenChange, table, nextTableNumber }: TableFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Close table form" className="max-w-md">
        <TableForm table={table} nextTableNumber={nextTableNumber} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function TableForm({
  table,
  nextTableNumber,
  onDone,
}: {
  table: DiningTable | null
  nextTableNumber: number
  onDone: () => void
}) {
  const baseId = useId()
  const id = (field: TableField) => `${baseId}-${field}`
  const formErrorId = `${baseId}-form-error`
  const isEdit = table !== null

  const form = useFormState({
    initialValues: tableFormValues(table, nextTableNumber),
    fields: TABLE_FIELDS,
    validate: validateTable,
  })
  const save = useSaveTable()
  const { values } = form

  const capacity = Number(values.capacity)
  const capacityValid = Number.isInteger(capacity) && capacity >= TABLE_LIMITS.capacityMin && capacity <= TABLE_LIMITS.capacityMax

  function stepCapacity(delta: number) {
    const current = Number.isInteger(capacity) ? capacity : 4
    const next = Math.min(TABLE_LIMITS.capacityMax, Math.max(TABLE_LIMITS.capacityMin, current + delta))
    form.setValue('capacity', String(next))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (save.isPending) return
    const invalid = form.beginSubmit()
    if (invalid) {
      focusById(id(invalid))
      return
    }

    save.mutate(
      { id: table?.id, input: toTableInput(values) },
      {
        onSuccess: (saved) => {
          toast.success(isEdit ? `Table ${saved.tableNumber} updated` : `Table ${saved.tableNumber} added`, {
            description: `${saved.capacity} ${saved.capacity === 1 ? 'seat' : 'seats'}`,
          })
          onDone()
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 404) {
            notifyTableError(error, "Couldn't save the table")
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
    <form noValidate onSubmit={handleSubmit} className="grid gap-5" aria-busy={save.isPending}>
      <DialogHeader>
        <DialogTitle>{isEdit ? `Edit table ${table.tableNumber}` : 'Add table'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Renumber the table or change how many it seats.' : 'Give it a number and say how many guests it seats.'}
        </DialogDescription>
      </DialogHeader>

      <div tabIndex={-1} id={formErrorId} className="outline-none">
        <FormAlert message={form.formError} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id={id('tableNumber')} label="Table number" error={form.errorFor('tableNumber')}>
          <Input
            id={id('tableNumber')}
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={values.tableNumber}
            onChange={(e) => form.setValue('tableNumber', e.target.value)}
            onBlur={() => form.touch('tableNumber')}
            onFocus={(e) => e.currentTarget.select()}
            className="h-12 text-lg tabular-nums"
            aria-invalid={!!form.errorFor('tableNumber')}
            aria-describedby={fieldDescribedBy(id('tableNumber'), { error: form.errorFor('tableNumber') })}
          />
        </FormField>

        <FormField id={id('capacity')} label="Seats" error={form.errorFor('capacity')}>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-12 shrink-0"
              onClick={() => stepCapacity(-1)}
              disabled={capacityValid && capacity <= TABLE_LIMITS.capacityMin}
              aria-label="One seat fewer"
            >
              <Minus aria-hidden="true" />
            </Button>
            <Input
              id={id('capacity')}
              inputMode="numeric"
              autoComplete="off"
              value={values.capacity}
              onChange={(e) => form.setValue('capacity', e.target.value)}
              onBlur={() => form.touch('capacity')}
              className="h-12 text-center text-lg tabular-nums"
              aria-invalid={!!form.errorFor('capacity')}
              aria-describedby={fieldDescribedBy(id('capacity'), { error: form.errorFor('capacity') })}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-12 shrink-0"
              onClick={() => stepCapacity(1)}
              disabled={capacityValid && capacity >= TABLE_LIMITS.capacityMax}
              aria-label="One seat more"
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>
        </FormField>
      </div>

      {/* Live preview of the table shape for the chosen size. */}
      <div className="grid h-28 place-items-center rounded-xl border border-dashed border-border-strong bg-sunken/60 px-4">
        {capacityValid ? (
          <TableShape capacity={capacity} status="Available" className="h-20 w-full max-w-72" />
        ) : (
          <p className="text-sm text-muted-foreground">Enter a seat count to preview the table.</p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending} aria-busy={save.isPending}>
          {save.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          {isEdit ? 'Save changes' : 'Add table'}
        </Button>
      </DialogFooter>
    </form>
  )
}
