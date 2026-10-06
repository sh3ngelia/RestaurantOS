import { CheckCheck } from 'lucide-react'

import type { KitchenTicket } from '@/api/kitchen'
import { Button } from '@/components/ui/button'
import { COURSE_LABELS } from '@/features/orders/rules'
import { groupByCourse, nextStatus, splitHeld } from '../rules'
import { HeldItems } from './HeldItems'
import { KitchenItem } from './KitchenItem'
import { TicketFrame } from './TicketFrame'

interface StationTicketProps {
  ticket: KitchenTicket
  now: Date
  inFlight: ReadonlySet<string>
  onAdvance: (itemIds: string[], to: 'InProgress' | 'Ready') => void
}

/**
 * A ticket on a station screen: tap a line to start it, tap again when it's ready, or bump the lot.
 * Held items sit at the bottom without actions; bumping leaves them alone.
 */
export function StationTicket({ ticket, now, inFlight, onAdvance }: StationTicketProps) {
  const { active, held } = splitHeld(ticket)
  const remaining = active.filter((i) => i.status !== 'Ready')
  const bumping = remaining.some((i) => inFlight.has(i.id))

  return (
    <TicketFrame
      ticket={ticket}
      now={now}
      footer={
        remaining.length > 0 && (
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-full text-base"
            disabled={bumping}
            onClick={() => onAdvance(remaining.map((i) => i.id), 'Ready')}
          >
            <CheckCheck aria-hidden="true" />
            Bump ticket
            <span className="sr-only">
              , mark {remaining.length} {remaining.length === 1 ? 'item' : 'items'} ready
            </span>
          </Button>
        )
      }
    >
      {groupByCourse(active).map(({ course, items }) => (
        <section key={course} aria-label={COURSE_LABELS[course].many} className="border-b border-border last:border-b-0">
          <h3 className="px-4 pt-2.5 text-sm font-semibold text-muted-foreground">{COURSE_LABELS[course].many}</h3>
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const to = nextStatus(item)
              return (
                <li key={item.id}>
                  <KitchenItem
                    item={item}
                    actionLabel={to === 'InProgress' ? 'Start' : to === 'Ready' ? 'Ready' : undefined}
                    onAction={to ? () => onAdvance([item.id], to) : undefined}
                    busy={inFlight.has(item.id)}
                  />
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      <HeldItems items={held} />
    </TicketFrame>
  )
}
