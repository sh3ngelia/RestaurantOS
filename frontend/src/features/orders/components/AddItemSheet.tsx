import { useId, type FormEvent } from 'react'
import { RadioGroup } from 'radix-ui'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import type { MenuItem } from '@/api/menu'
import { COURSES, type Course, type Order } from '@/api/orders'
import { AllergenBadges } from '@/components/AllergenBadges'
import { FormAlert, FormField } from '@/components/FormField'
import { QuantityStepper } from '@/components/QuantityStepper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { STATION_ICONS } from '@/features/menu/stations'
import { useFormState } from '@/hooks/useFormState'
import { formatPrice } from '@/lib/format'
import { fieldDescribedBy, focusById } from '@/lib/forms'
import { cn } from '@/lib/utils'
import { useAddItem } from '../hooks'
import { COURSE_LABELS, defaultCourseFor } from '../rules'

/** Mirrors AddOrderItemRequestValidator. */
const LIMITS = { quantityMax: 50, notes: 500 } as const
const FIELDS = ['quantity', 'course', 'seatNumber', 'notes'] as const
type Field = (typeof FIELDS)[number]
type Values = Record<Field, string>

function validate(values: Values): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {}
  const quantity = Number(values.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > LIMITS.quantityMax) {
    errors.quantity = `Quantity must be between 1 and ${LIMITS.quantityMax}.`
  }
  const seat = values.seatNumber.trim()
  if (seat && (!/^\d+$/.test(seat) || Number(seat) < 1)) errors.seatNumber = 'Use a seat number from 1 up.'
  if (values.notes.trim().length > LIMITS.notes) errors.notes = `Keep notes under ${LIMITS.notes} characters.`
  return errors
}

interface AddItemSheetProps {
  order: Order
  item: MenuItem | null
  /** Changes on every pick, so a fresh form mounts even if the sheet is still animating closed. */
  pickId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddItemSheet({ order, item, pickId, open, onOpenChange }: AddItemSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" closeLabel="Close" className="w-full sm:w-[min(28rem,100vw)]">
        {item && <AddItemForm key={pickId} order={order} item={item} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

function AddItemForm({ order, item, onDone }: { order: Order; item: MenuItem; onDone: () => void }) {
  const baseId = useId()
  const id = (field: Field) => `${baseId}-${field}`
  const formErrorId = `${baseId}-form-error`
  const add = useAddItem()
  const StationIcon = STATION_ICONS[item.preparationStation]
  const isBar = item.preparationStation === 'Bar'

  const form = useFormState<Field, Values>({
    initialValues: { quantity: '1', course: defaultCourseFor(item.categoryName), seatNumber: '', notes: '' },
    fields: FIELDS,
    validate,
  })
  const { values } = form
  const quantity = Number(values.quantity) || 1

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (add.isPending) return
    const invalid = form.beginSubmit()
    if (invalid) {
      focusById(id(invalid))
      return
    }

    add.mutate(
      {
        orderId: order.id,
        input: {
          menuItemId: item.id,
          quantity,
          course: values.course as Course,
          seatNumber: values.seatNumber.trim() ? Number(values.seatNumber) : null,
          notes: values.notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success(`${quantity} × ${item.name} added`, { description: 'Send the ticket when the table is ready.' })
          onDone()
        },
        onError: (error) => {
          // A 400 detail such as "Khinkali is not available right now." lands in the form alert.
          const field = form.applyServerError(error)
          focusById(field ? id(field) : formErrorId)
        },
      },
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col" aria-busy={add.isPending}>
      <SheetHeader>
        <SheetTitle>{item.name}</SheetTitle>
        <SheetDescription className="flex items-center gap-2">
          <span className="tabular-nums">{formatPrice(item.price)}</span>
          <span aria-hidden="true">·</span>
          <StationIcon className="size-3.5" aria-hidden="true" />
          {item.preparationStation}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <div tabIndex={-1} id={formErrorId} className="outline-none">
          <FormAlert message={form.formError} />
        </div>

        {item.allergens.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3">
            <p className="mb-2 text-xs font-medium text-destructive">Allergens</p>
            <AllergenBadges allergens={item.allergens} />
          </div>
        )}

        <FormField id={id('quantity')} label="Quantity" error={form.errorFor('quantity')}>
          <QuantityStepper
            label={`Quantity of ${item.name}`}
            value={quantity}
            max={LIMITS.quantityMax}
            size="lg"
            onChange={(n) => form.setValue('quantity', String(n))}
          />
        </FormField>

        <FormField
          id={id('course')}
          label="Course"
          hint={isBar ? 'Drinks go to the bar as soon as you send, whatever the course.' : undefined}
          error={form.errorFor('course')}
        >
          <RadioGroup.Root
            id={id('course')}
            value={values.course}
            onValueChange={(value) => form.setValue('course', value)}
            aria-labelledby={`${id('course')}-label`}
            aria-describedby={fieldDescribedBy(id('course'), { error: form.errorFor('course'), hint: isBar })}
            className="grid grid-cols-3 gap-1 rounded-xl border border-input bg-sunken p-1"
          >
            {COURSES.map((course) => (
              <RadioGroup.Item
                key={course}
                value={course}
                className={cn(
                  'h-11 rounded-lg text-sm font-medium text-muted-foreground outline-none',
                  'transition-[background-color,color,box-shadow] duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                  'data-[state=checked]:bg-card data-[state=checked]:text-foreground data-[state=checked]:shadow-soft',
                )}
              >
                {COURSE_LABELS[course].one}
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
        </FormField>

        <FormField id={id('seatNumber')} label="Seat" aside="Optional" error={form.errorFor('seatNumber')} className="max-w-36">
          <Input
            id={id('seatNumber')}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Any"
            value={values.seatNumber}
            onChange={(e) => form.setValue('seatNumber', e.target.value)}
            onBlur={() => form.touch('seatNumber')}
            className="h-11 tabular-nums"
            aria-invalid={!!form.errorFor('seatNumber')}
            aria-describedby={fieldDescribedBy(id('seatNumber'), { error: form.errorFor('seatNumber') })}
          />
        </FormField>

        <FormField id={id('notes')} label="Notes" aside="Optional" error={form.errorFor('notes')}>
          <Textarea
            id={id('notes')}
            value={values.notes}
            onChange={(e) => form.setValue('notes', e.target.value)}
            onBlur={() => form.touch('notes')}
            rows={2}
            className="min-h-18"
            placeholder="No onions, sauce on the side."
            aria-invalid={!!form.errorFor('notes')}
            aria-describedby={fieldDescribedBy(id('notes'), { error: form.errorFor('notes') })}
          />
        </FormField>
      </div>

      <SheetFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={add.isPending}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={add.isPending} aria-busy={add.isPending}>
          {add.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          Add {quantity} · <span className="tabular-nums">{formatPrice(item.price * quantity)}</span>
        </Button>
      </SheetFooter>
    </form>
  )
}
