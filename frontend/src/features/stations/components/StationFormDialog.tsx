import { useId, useState, type FormEvent } from 'react'
import { RadioGroup } from 'radix-ui'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError } from '@/api/errors'
import { STATION_TYPES, type Station, type StationType } from '@/api/stations'
import { FormAlert, FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useFormState } from '@/hooks/useFormState'
import { segmentClass, segmentGroupClass } from '@/lib/controls'
import { fieldDescribedBy, focusById } from '@/lib/forms'
import { cn } from '@/lib/utils'
import { notifyStationError, useSaveStation } from '../hooks'
import { STATION_ICONS } from '../icons'
import { STATION_FIELDS, stationFormValues, toStationInput, validateStation, type StationField } from '../validation'

interface StationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null → create a new station. */
  station: Station | null
  nextDisplayOrder: number
}

export function StationFormDialog({ open, onOpenChange, station, nextDisplayOrder }: StationFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Close station form" className="max-w-md">
        <StationForm station={station} nextDisplayOrder={nextDisplayOrder} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function StationForm({ station, nextDisplayOrder, onDone }: { station: Station | null; nextDisplayOrder: number; onDone: () => void }) {
  const baseId = useId()
  const id = (field: StationField) => `${baseId}-${field}`
  const firesId = `${baseId}-fires`
  const formErrorId = `${baseId}-form-error`
  const isEdit = station !== null

  const form = useFormState({
    initialValues: stationFormValues(station, nextDisplayOrder),
    fields: STATION_FIELDS,
    validate: validateStation,
  })
  const save = useSaveStation()
  const { values } = form
  const [firesImmediately, setFiresImmediately] = useState(station?.firesImmediately ?? false)
  // On a new station the switch follows the type (bars usually fire straight away) until someone sets it.
  const [firesTouched, setFiresTouched] = useState(isEdit)

  function changeType(type: StationType) {
    form.setValue('type', type)
    if (!firesTouched) setFiresImmediately(type === 'Bar')
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
      { id: station?.id, input: toStationInput(values, firesImmediately) },
      {
        onSuccess: (saved) => {
          toast.success(isEdit ? 'Station updated' : 'Station created', { description: saved.name })
          onDone()
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 404) {
            notifyStationError(error, "Couldn't save the station")
            onDone()
            return
          }
          // 400s land on Name / Type / DisplayOrder; a 409 "already exists" becomes the form alert.
          const field = form.applyServerError(error)
          focusById(field ? id(field) : formErrorId)
        },
      },
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-4" aria-busy={save.isPending}>
      <DialogHeader>
        <DialogTitle>{isEdit ? `Edit ${station.name}` : 'New station'}</DialogTitle>
        <DialogDescription>Menu items are assigned to a station, which receives their tickets.</DialogDescription>
      </DialogHeader>

      <div tabIndex={-1} id={formErrorId} className="outline-none">
        <FormAlert message={form.formError} />
      </div>

      <FormField id={id('name')} label="Name" error={form.errorFor('name')}>
        <Input
          id={id('name')}
          value={values.name}
          onChange={(e) => form.setValue('name', e.target.value)}
          onBlur={() => form.touch('name')}
          placeholder="e.g. Grill"
          autoComplete="off"
          autoFocus
          aria-invalid={!!form.errorFor('name')}
          aria-describedby={fieldDescribedBy(id('name'), { error: form.errorFor('name') })}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <FormField id={id('type')} label="Type" error={form.errorFor('type')}>
          <RadioGroup.Root
            id={id('type')}
            value={values.type}
            onValueChange={(value) => changeType(value as StationType)}
            aria-labelledby={`${id('type')}-label`}
            aria-describedby={fieldDescribedBy(id('type'), { error: form.errorFor('type') })}
            className={cn(segmentGroupClass, 'grid-cols-2')}
          >
            {STATION_TYPES.map((type) => {
              const Icon = STATION_ICONS[type]
              return (
                <RadioGroup.Item key={type} value={type} className={segmentClass(false, 'flex h-8 items-center justify-center gap-2')}>
                  <Icon className="size-4" aria-hidden="true" />
                  {type}
                </RadioGroup.Item>
              )
            })}
          </RadioGroup.Root>
        </FormField>

        <FormField id={id('displayOrder')} label="Display order" error={form.errorFor('displayOrder')}>
          <Input
            id={id('displayOrder')}
            inputMode="numeric"
            value={values.displayOrder}
            onChange={(e) => form.setValue('displayOrder', e.target.value)}
            onBlur={() => form.touch('displayOrder')}
            autoComplete="off"
            className="tabular-nums"
            aria-invalid={!!form.errorFor('displayOrder')}
            aria-describedby={fieldDescribedBy(id('displayOrder'), { error: form.errorFor('displayOrder') })}
          />
        </FormField>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-md border border-border px-3 py-2.5">
        <div>
          <label htmlFor={firesId} className="text-[13px] font-medium text-foreground/85">
            Fires immediately
          </label>
          <p id={`${firesId}-hint`} className="mt-0.5 text-xs text-muted-foreground">
            Items for this station are sent as soon as the round is sent, without waiting for their course.
          </p>
        </div>
        <Switch
          id={firesId}
          checked={firesImmediately}
          onCheckedChange={(checked) => {
            setFiresImmediately(checked)
            setFiresTouched(true)
          }}
          aria-describedby={`${firesId}-hint`}
          className="mt-0.5"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending} aria-busy={save.isPending}>
          {save.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          {isEdit ? 'Save changes' : 'Create station'}
        </Button>
      </DialogFooter>
    </form>
  )
}
