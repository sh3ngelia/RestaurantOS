import { LoaderCircle, Send } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface UnsentItemsDialogProps {
  open: boolean
  count: number
  /** "Send now" is in flight; the other choices wait for it. */
  sending: boolean
  onSend: () => void
  onLeave: () => void
  onStay: () => void
}

/** Asked when the waiter leaves an order that still has items the kitchen hasn't received. */
export function UnsentItemsDialog({ open, count, sending, onSend, onLeave, onStay }: UnsentItemsDialogProps) {
  return (
    // Escape or a click outside means "Stay": never leave by accident.
    <AlertDialog open={open} onOpenChange={(next) => !next && !sending && onStay()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {count} {count === 1 ? 'item has' : 'items have'} not been sent to the kitchen
          </AlertDialogTitle>
          <AlertDialogDescription>
            Send {count === 1 ? 'it' : 'them'} now, or leave {count === 1 ? 'it' : 'them'} on the ticket to send later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="ghost" onClick={onStay} disabled={sending}>
            Stay
          </Button>
          <Button variant="outline" onClick={onLeave} disabled={sending}>
            Leave without sending
          </Button>
          <Button onClick={onSend} disabled={sending} aria-busy={sending} autoFocus>
            {sending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
            {sending ? 'Sending…' : 'Send now'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
