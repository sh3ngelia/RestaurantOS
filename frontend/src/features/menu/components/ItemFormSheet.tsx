import { useId, useState, type FormEvent } from 'react'
import { RadioGroup } from 'radix-ui'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError } from '@/api/errors'
import { ALLERGENS, PREPARATION_STATIONS, type Allergen, type MenuCategory, type MenuItem } from '@/api/menu'
import { FormAlert, FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useFormState } from '@/hooks/useFormState'
import { fieldDescribedBy, focusById } from '@/lib/forms'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { notifyMenuError, useSaveItem } from '../hooks'
import { STATION_ICONS } from '../stations'
import {
  ITEM_FIELDS,
  ITEM_LIMITS,
  itemFormValues,
  toItemInput,
  validateItem,
  type ItemField,
} from '../validation'

interface ItemFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null → create a new item. */
  item: MenuItem | null
  defaultCategoryId?: string
  categories: MenuCategory[]
}

export function ItemFormSheet({ open, onOpenChange, item, defaultCategoryId, categories }: ItemFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" closeLabel="Close item form" className="w-full sm:w-[min(34rem,100vw)]">
        {/* Mounted fresh on every open, so the form always starts from the current item. */}
        <ItemForm item={item} defaultCategoryId={defaultCategoryId} categories={categories} onDone={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}

function ItemForm({
  item,
  defaultCategoryId,
  categories,
  onDone,
}: {
  item: MenuItem | null
  defaultCategoryId?: string
  categories: MenuCategory[]
  onDone: () => void
}) {
  const baseId = useId()
  const id = (field: ItemField) => `${baseId}-${field}`
  const formErrorId = `${baseId}-form-error`

  const form = useFormState({
    initialValues: itemFormValues(item, { categoryId: defaultCategoryId ?? categories[0]?.id }),
    fields: ITEM_FIELDS,
    validate: validateItem,
  })
  const save = useSaveItem()
  const [allergens, setAllergens] = useState<Allergen[]>(() => item?.allergens ?? [])
  const { values } = form
  const isEdit = item !== null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (save.isPending) return
    const invalid = form.beginSubmit()
    if (invalid) {
      focusById(id(invalid))
      return
    }

    save.mutate(
      { id: item?.id, input: toItemInput(values, allergens) },
      {
        onSuccess: (saved) => {
          toast.success(isEdit ? 'Changes saved' : 'Added to the menu', {
            description: `${saved.name} · ${saved.categoryName} · ${formatPrice(saved.price)}`,
          })
          onDone()
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 404) {
            notifyMenuError(error, "Couldn't save the item")
            onDone()
            return
          }
          const field = form.applyServerError(error)
          focusById(field ? id(field) : formErrorId)
        },
      },
    )
  }

  const descriptionLength = values.description.trim().length

  return (
    <form noValidate onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col" aria-busy={save.isPending}>
      <SheetHeader>
        <SheetTitle>{isEdit ? `Edit ${item.name}` : 'New item'}</SheetTitle>
        <SheetDescription>
          {isEdit ? 'Changes reach every station as soon as you save.' : 'Add a dish or drink to the menu.'}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <div tabIndex={-1} id={formErrorId} className="outline-none">
          <FormAlert message={form.formError} />
        </div>

        <FormField id={id('name')} label="Name" error={form.errorFor('name')}>
          <Input
            id={id('name')}
            value={values.name}
            onChange={(e) => form.setValue('name', e.target.value)}
            onBlur={() => form.touch('name')}
            placeholder="e.g. Khinkali"
            autoComplete="off"
            autoFocus={!isEdit}
            aria-invalid={!!form.errorFor('name')}
            aria-describedby={fieldDescribedBy(id('name'), { error: form.errorFor('name') })}
          />
        </FormField>

        <FormField
          id={id('description')}
          label="Description"
          aside={descriptionLength > ITEM_LIMITS.description * 0.8 ? `${descriptionLength}/${ITEM_LIMITS.description}` : 'Optional'}
          error={form.errorFor('description')}
        >
          <Textarea
            id={id('description')}
            value={values.description}
            onChange={(e) => form.setValue('description', e.target.value)}
            onBlur={() => form.touch('description')}
            placeholder="What the guest should know: key ingredients, allergens, how it's served."
            rows={3}
            aria-invalid={!!form.errorFor('description')}
            aria-describedby={fieldDescribedBy(id('description'), { error: form.errorFor('description') })}
          />
        </FormField>

        <FormField id={id('categoryId')} label="Category" error={form.errorFor('categoryId')}>
          <Select
            value={values.categoryId}
            onValueChange={(value) => {
              form.setValue('categoryId', value)
              form.touch('categoryId')
            }}
          >
            <SelectTrigger
              id={id('categoryId')}
              aria-invalid={!!form.errorFor('categoryId')}
              aria-describedby={fieldDescribedBy(id('categoryId'), { error: form.errorFor('categoryId') })}
            >
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          id={id('preparationStation')}
          label="Station"
          hint="Where the ticket prints when this is ordered."
          error={form.errorFor('preparationStation')}
        >
          <RadioGroup.Root
            id={id('preparationStation')}
            value={values.preparationStation}
            onValueChange={(value) => form.setValue('preparationStation', value)}
            aria-labelledby={`${id('preparationStation')}-label`}
            aria-describedby={fieldDescribedBy(id('preparationStation'), {
              error: form.errorFor('preparationStation'),
              hint: true,
            })}
            className="grid grid-cols-2 gap-1 rounded-xl border border-input bg-sunken p-1"
          >
            {PREPARATION_STATIONS.map((station) => {
              const Icon = STATION_ICONS[station]
              return (
                <RadioGroup.Item
                  key={station}
                  value={station}
                  className={cn(
                    'flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium text-muted-foreground outline-none',
                    'transition-[background-color,color,box-shadow] duration-150 hover:text-foreground',
                    'focus-visible:ring-2 focus-visible:ring-ring',
                    'data-[state=checked]:bg-card data-[state=checked]:text-foreground data-[state=checked]:shadow-soft',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {station}
                </RadioGroup.Item>
              )
            })}
          </RadioGroup.Root>
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id={id('price')} label="Price" error={form.errorFor('price')}>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground" aria-hidden="true">
                €
              </span>
              <Input
                id={id('price')}
                inputMode="decimal"
                value={values.price}
                onChange={(e) => form.setValue('price', e.target.value)}
                onBlur={() => form.touch('price')}
                placeholder="0.00"
                autoComplete="off"
                className="pl-8 tabular-nums"
                aria-invalid={!!form.errorFor('price')}
                aria-describedby={fieldDescribedBy(id('price'), { error: form.errorFor('price') })}
              />
            </div>
          </FormField>

          <FormField id={id('preparationTimeInMinutes')} label="Prep time" error={form.errorFor('preparationTimeInMinutes')}>
            <div className="relative">
              <Input
                id={id('preparationTimeInMinutes')}
                inputMode="numeric"
                value={values.preparationTimeInMinutes}
                onChange={(e) => form.setValue('preparationTimeInMinutes', e.target.value)}
                onBlur={() => form.touch('preparationTimeInMinutes')}
                placeholder="15"
                autoComplete="off"
                className="pr-14 tabular-nums"
                aria-invalid={!!form.errorFor('preparationTimeInMinutes')}
                aria-describedby={fieldDescribedBy(id('preparationTimeInMinutes'), {
                  error: form.errorFor('preparationTimeInMinutes'),
                })}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-muted-foreground" aria-hidden="true">
                min
              </span>
            </div>
          </FormField>
        </div>

        <AllergenPicker value={allergens} onChange={setAllergens} />
      </div>

      <SheetFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending} aria-busy={save.isPending}>
          {save.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          {isEdit ? 'Save changes' : 'Add item'}
        </Button>
      </SheetFooter>
    </form>
  )
}

/** The 14 EU allergens as toggles; selected ones use the same warning tone as the badges. */
function AllergenPicker({ value, onChange }: { value: Allergen[]; onChange: (next: Allergen[]) => void }) {
  const legendId = useId()
  function toggle(allergen: Allergen) {
    // Keep the canonical order so the badges read the same everywhere.
    onChange(value.includes(allergen) ? value.filter((a) => a !== allergen) : ALLERGENS.filter((a) => a === allergen || value.includes(a)))
  }
  return (
    <fieldset aria-labelledby={legendId} className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <legend id={legendId} className="text-[13px] leading-none font-medium text-foreground/90">
          Allergens
        </legend>
        <span className="text-xs text-muted-foreground">{value.length ? `${value.length} selected` : 'None declared'}</span>
      </div>
      <p className="text-xs text-muted-foreground">Mark every allergen the dish contains. Waiters see them on the ticket.</p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {ALLERGENS.map((allergen) => {
          const selected = value.includes(allergen)
          return (
            <button
              key={allergen}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(allergen)}
              className={cn(
                'h-10 rounded-lg border px-3 text-left text-sm outline-none transition-colors duration-150',
                'focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'border-destructive/40 bg-destructive/10 font-medium text-destructive'
                  : 'border-input bg-sunken text-muted-foreground hover:border-border-strong hover:text-foreground',
              )}
            >
              {allergen}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
