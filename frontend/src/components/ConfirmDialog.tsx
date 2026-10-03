import { useState, type MouseEvent, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

import { FormAlert } from '@/components/FormField'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description: ReactNode
  confirmLabel: string
  /** Resolve to close; reject to keep the dialog open (the caller reports the error). */
  onConfirm: () => Promise<unknown>
  /** Blocks confirmation, e.g. when the action can't succeed yet. */
  confirmDisabled?: boolean
  /** Red for destructive actions (the default); the accent for a deliberate but safe override. */
  confirmVariant?: 'destructive' | 'default'
  /** Why the last attempt was refused (e.g. a 409 detail), shown inside the dialog. */
  error?: string | null
}

/** Confirmation that stays open, with a spinner, until the action settles. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
  confirmVariant = 'destructive',
  error = null,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false)

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault() // AlertDialog.Action closes by default; close only on success
    setPending(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // The caller has already surfaced the error.
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <FormAlert message={error} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant={confirmVariant} onClick={handleConfirm} disabled={pending || confirmDisabled} aria-busy={pending}>
            {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
