import { Flame, LoaderCircle } from 'lucide-react'

import type { KitchenTicket } from '@/api/kitchen'
import type { Course } from '@/api/orders'
import { StatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { notifyOrderError, useOrder } from '@/features/orders/hooks'
import { COURSE_LABELS, lastCourseReady } from '@/features/orders/rules'
import { useFireNext } from '../hooks'
import { groupByCourse, nextHeldCourse, readyCourses, splitHeld } from '../rules'
import { HeldItems } from './HeldItems'
import { KitchenItem } from './KitchenItem'
import { TicketFrame } from './TicketFrame'

interface PassTicketProps {
  ticket: KitchenTicket
  now: Date
  /** Kitchen and Manager may mark items ready from the pass; Bar watches. */
  canMarkReady: boolean
  /** Kitchen and Manager may fire the next held course. */
  canFire: boolean
  inFlight: ReadonlySet<string>
  onReady: (itemIds: string[]) => void
}

/**
 * One order on the pass: every fired item with its station and status, which courses can go,
 * and the held courses still to fire, with how long ago the course before them was ready.
 */
export function PassTicket({ ticket, now, canMarkReady, canFire, inFlight, onReady }: PassTicketProps) {
  const { active, held } = splitHeld(ticket)
  const goes = readyCourses(ticket)
  const ready = new Set(goes)
  const heldCourse = nextHeldCourse(ticket)

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
      footer={heldCourse && <FireNext ticket={ticket} course={heldCourse} now={now} canFire={canFire} />}
    >
      {groupByCourse(active).map(({ course, items }) => (
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
      <HeldItems items={held} showStation />
    </TicketFrame>
  )
}

/**
 * "Fire mains", with the chef's timing cue: when the course before it was last marked ready.
 * Ticket items carry no readyAt, so the cue comes from the order itself (GET /api/orders/{id}),
 * which OrderChanged keeps fresh like every other order query.
 */
function FireNext({ ticket, course, now, canFire }: { ticket: KitchenTicket; course: Course; now: Date; canFire: boolean }) {
  const order = useOrder(ticket.orderId).data
  const fire = useFireNext()
  const courseName = COURSE_LABELS[course].many.toLowerCase()
  const where = ticket.tableNumber !== null ? `table ${ticket.tableNumber}` : `order #${ticket.orderNumber}`

  const previous = order ? lastCourseReady(order) : null
  let cue: string | null = null
  if (previous) {
    const name = COURSE_LABELS[previous.course].many
    if (previous.readyAt) {
      const minutes = Math.max(0, Math.floor((now.getTime() - Date.parse(previous.readyAt)) / 60_000))
      cue = `${name} ready ${minutes === 0 ? 'just now' : `${minutes} min ago`}`
    } else {
      cue = `${name} not all ready yet`
    }
  }

  return (
    <div className="space-y-2">
      {cue && (
        <p className="text-base font-medium text-foreground" aria-live="polite">
          {cue}
        </p>
      )}
      {canFire && (
        <Button
          size="lg"
          className="h-12 w-full text-base"
          disabled={fire.isPending}
          aria-busy={fire.isPending}
          onClick={() =>
            fire.mutate(ticket.orderId, { onError: (error) => notifyOrderError(error, `Couldn't fire ${courseName} for ${where}`) })
          }
        >
          {fire.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Flame aria-hidden="true" />}
          Fire {courseName}
          <span className="sr-only"> for {where}</span>
        </Button>
      )}
    </div>
  )
}
