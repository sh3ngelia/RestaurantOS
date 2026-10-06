import type { KitchenTicketItem } from '@/api/kitchen'
import { COURSE_LABELS } from '@/features/orders/rules'
import { groupByCourse } from '../rules'
import { KitchenItem } from './KitchenItem'

/**
 * Items sent but waiting for their course ("Mains on hold"), at the bottom of a ticket.
 * Muted and without actions: the API refuses to start them until the course is fired.
 */
export function HeldItems({ items, showStation = false }: { items: KitchenTicketItem[]; showStation?: boolean }) {
  if (items.length === 0) return null
  return (
    <>
      {groupByCourse(items).map(({ course, items: courseItems }) => {
        const label = `${COURSE_LABELS[course].many} on hold`
        return (
          <section key={course} aria-label={label} className="border-b border-dashed border-border bg-muted/40 last:border-b-0">
            <h3 className="px-4 pt-2.5 text-sm font-semibold text-muted-foreground">{label}</h3>
            <ul className="divide-y divide-border">
              {courseItems.map((item) => (
                <li key={item.id}>
                  <KitchenItem item={item} showStation={showStation} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
