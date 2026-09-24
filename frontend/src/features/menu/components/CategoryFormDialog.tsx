import { useId, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError } from '@/api/errors'
import type { MenuCategory } from '@/api/menu'
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
import { useFormState } from '@/hooks/useFormState'
import { fieldDescribedBy, focusById } from '@/lib/forms'
import { notifyMenuError, useSaveCategory } from '../hooks'
import {
  CATEGORY_FIELDS,
  categoryFormValues,
  toCategoryInput,
  validateCategory,
  type CategoryField,
} from '../validation'

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null → create a new category. */
  category: MenuCategory | null
  nextDisplayOrder: number
}

export function CategoryFormDialog({ open, onOpenChange, category, nextDisplayOrder }: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Close category form">
        <CategoryForm category={category} nextDisplayOrder={nextDisplayOrder} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function CategoryForm({
  category,
  nextDisplayOrder,
  onDone,
}: {
  category: MenuCategory | null
  nextDisplayOrder: number
  onDone: () => void
}) {
  const baseId = useId()
  const id = (field: CategoryField) => `${baseId}-${field}`
  const formErrorId = `${baseId}-form-error`
  const isEdit = category !== null

  const form = useFormState({
    initialValues: categoryFormValues(category, nextDisplayOrder),
    fields: CATEGORY_FIELDS,
    validate: validateCategory,
  })
  const save = useSaveCategory()
  const { values } = form

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (save.isPending) return
    const invalid = form.beginSubmit()
    if (invalid) {
      focusById(id(invalid))
      return
    }

    save.mutate(
      { id: category?.id, input: toCategoryInput(values) },
      {
        onSuccess: (saved) => {
          toast.success(isEdit ? 'Category updated' : 'Category created', { description: saved.name })
          onDone()
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 404) {
            notifyMenuError(error, "Couldn't save the category")
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
        <DialogTitle>{isEdit ? 'Edit category' : 'New category'}</DialogTitle>
        <DialogDescription>
          Categories are the sections of your menu, such as Starters, Mains or Wine by the glass.
        </DialogDescription>
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
          placeholder="e.g. Starters"
          autoComplete="off"
          autoFocus
          aria-invalid={!!form.errorFor('name')}
          aria-describedby={fieldDescribedBy(id('name'), { error: form.errorFor('name') })}
        />
      </FormField>

      <FormField id={id('description')} label="Description" aside="Optional" error={form.errorFor('description')}>
        <Textarea
          id={id('description')}
          value={values.description}
          onChange={(e) => form.setValue('description', e.target.value)}
          onBlur={() => form.touch('description')}
          placeholder="A line to set the scene for this section."
          rows={2}
          className="min-h-18"
          aria-invalid={!!form.errorFor('description')}
          aria-describedby={fieldDescribedBy(id('description'), { error: form.errorFor('description') })}
        />
      </FormField>

      <FormField
        id={id('displayOrder')}
        label="Display order"
        hint="Lower numbers appear first."
        error={form.errorFor('displayOrder')}
        className="max-w-40"
      >
        <Input
          id={id('displayOrder')}
          inputMode="numeric"
          value={values.displayOrder}
          onChange={(e) => form.setValue('displayOrder', e.target.value)}
          onBlur={() => form.touch('displayOrder')}
          autoComplete="off"
          className="tabular-nums"
          aria-invalid={!!form.errorFor('displayOrder')}
          aria-describedby={fieldDescribedBy(id('displayOrder'), { error: form.errorFor('displayOrder'), hint: true })}
        />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending} aria-busy={save.isPending}>
          {save.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          {isEdit ? 'Save changes' : 'Create category'}
        </Button>
      </DialogFooter>
    </form>
  )
}
