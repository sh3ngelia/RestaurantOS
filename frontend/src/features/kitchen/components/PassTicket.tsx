import type { KitchenTicket } from '@/api/kitchen'
import { StatusChip } from '@/components/StatusChip'
import { COURSE_LABELS } from '@/features/orders/rules'
import { groupByCourse, readyCourses } from '../rules'
import { KitchenItem } from './KitchenItem'
import { TicketFrame } from './TicketFrame'

interface PassTicketProps {
  ticket: KitchenTicket
  now: Date
  /** Kitchen and Manager may mark items ready from the pass; Bar watches. */
  canMarkReady: boolean
  inFlight: ReadonlySet<string>
  onReady: (itemIds: string[]) => void
}

/** One order on the pass: every fired item with its station and status, and which courses can go. */
export function PassTicket({ ticket, now, canMarkReady, inFlight, onReady }: PassTicketProps) {
  const goes = readyCourses(ticket)
  const ready = new Set(goes)

  return (
    <TicketFrame
      ticket={ticket}
      now={now}
      highlight={goes.length > 0}
      badge={
        goes.length > 0 && (
          <StatusChip tone="attention" className="h-7 px-2 text-base">
            Ready to go
          </StatusChip>
        )
      }
    >
      {groupByCourse(ticket.items).map(({ course, items }) => (
        <section key={course} aria-label={COURSE_LABELS[course].many} className="border-b border-border last:border-b-0">
          <h3 className="flex items-center justify-between gap-2 px-4 pt-2.5 text-sm font-semibold text-muted-foreground">
            {COURSE_LABELS[course].many}
            {ready.has(course) && <span className="text-status-attention">Ready to go</span>}
          </h3>
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const actionable = canMarkReady && item.status !== 'Ready'
              return (
                <li key={item.id}>
                  <KitchenItem
                    item={item}
                    showStation
                    actionLabel={actionable ? 'Ready' : undefined}
                    onAction={actionable ? () => onReady([item.id]) : undefined}
                    busy={inFlight.has(item.id)}
                  />
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </TicketFrame>
  )
}
