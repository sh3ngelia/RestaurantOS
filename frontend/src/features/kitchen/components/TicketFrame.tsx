import type { ReactNode } from 'react'

import type { KitchenTicket } from '@/api/kitchen'
import { STATUS_TONE_CLASSES } from '@/lib/status-tones'
import { cn } from '@/lib/utils'
import {
  TICKET_LATE_MINUTES,
  TICKET_WARNING_MINUTES,
  TIME_STATE_TONES,
  formatTimer,
  ticketTimeState,
  type TicketTimeState,
} from '../rules'

const FRAME_BORDER: Record<TicketTimeState, string> = {
  normal: 'border-border-strong',
  warning: 'border-status-attention',
  late: 'border-status-danger',
}

interface TicketFrameProps {
  ticket: KitchenTicket
  now: Date
  /** Shown under the timer, e.g. "Ready to go" on the pass. */
  badge?: ReactNode
  /** Outlines the whole ticket in the accent (food ready to leave the pass). */
  highlight?: boolean
  footer?: ReactNode
  children: ReactNode
}

/** A ticket's card: big table number, small order number and a ticking timer that changes colour as it ages. */
export function TicketFrame({ ticket, now, badge, highlight = false, footer, children }: TicketFrameProps) {
  const elapsed = now.getTime() - new Date(ticket.firedAt).getTime()
  const state = ticketTimeState(elapsed)
  const tone = STATUS_TONE_CLASSES[TIME_STATE_TONES[state]]
  const where = ticket.tableNumber !== null ? `Table ${ticket.tableNumber}` : 'Takeaway'
  const headingId = `ticket-${ticket.orderId}`

  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        'flex flex-col overflow-hidden rounded-md border-2 bg-card transition-colors duration-150',
        highlight ? 'border-status-attention' : FRAME_BORDER[state],
      )}
    >
      <header
        className={cn(
          'flex items-start justify-between gap-3 border-b border-border px-4 py-3',
          state === 'warning' && 'bg-status-attention/10',
          state === 'late' && 'bg-status-danger/10',
        )}
      >
        <div className="min-w-0">
          <h2 id={headingId} className="text-4xl leading-none font-bold tabular-nums">
            {ticket.tableNumber !== null ? (
              <>
                <span className="sr-only">Table </span>
                {ticket.tableNumber}
              </>
            ) : (
              <span className="text-2xl">Takeaway</span>
            )}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">
            #{ticket.orderNumber}
            <span className="sr-only">, {where}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className={cn('text-3xl leading-none font-semibold tabular-nums', state !== 'normal' && tone.text)}>
            <span className="sr-only">Open for </span>
            <time dateTime={ticket.firedAt}>{formatTimer(elapsed)}</time>
          </p>
          {state !== 'normal' && (
            <p className={cn('text-sm font-semibold', tone.text)}>
              {state === 'late' ? `Late, over ${TICKET_LATE_MINUTES} min` : `Over ${TICKET_WARNING_MINUTES} min`}
            </p>
          )}
          {badge}
        </div>
      </header>

      <div className="flex-1">{children}</div>

      {footer && <footer className="border-t border-border p-3">{footer}</footer>}
    </article>
  )
}
