import { AnimatePresence, motion } from 'motion/react'

import type { Reservation } from '@/api/reservations'
import { formatTime } from '@/lib/dates'
import { listItemMotion } from '@/lib/motion'
import { ReservationRow, ReservationRowHeader } from './ReservationRow'

interface ReservationTimelineProps {
  reservations: Reservation[]
  now: Date
  /** Show the "now" marker between past and upcoming hours. */
  isToday: boolean
  onReschedule: (reservation: Reservation) => void
  onEdit: (reservation: Reservation) => void
  onCancel: (reservation: Reservation) => void
}

interface HourGroup {
  label: string
  /** Start of the hour, for placing the "now" marker. */
  startsAt: Date
  items: Reservation[]
}

function groupByHour(reservations: Reservation[]): HourGroup[] {
  const groups: HourGroup[] = []
  for (const reservation of reservations) {
    const startsAt = new Date(reservation.reservationTime)
    startsAt.setMinutes(0, 0, 0)
    const label = formatTime(startsAt)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(reservation)
    else groups.push({ label, startsAt, items: [reservation] })
  }
  return groups
}

/** The day's bookings as one divided list, with a sub-heading per hour. */
export function ReservationTimeline({ reservations, now, isToday, onReschedule, onEdit, onCancel }: ReservationTimelineProps) {
  const groups = groupByHour(reservations)
  // The marker sits before the first hour that hasn't finished yet, when earlier hours exist.
  const nowIndex = isToday ? groups.findIndex((g) => g.startsAt.getTime() + 3_600_000 > now.getTime()) : -1

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <ReservationRowHeader />
      <ol aria-label="Bookings by hour" className="divide-y divide-border border-border lg:border-t">
        <AnimatePresence initial={false} mode="popLayout">
          {groups.map((group, index) => (
            <motion.li key={group.label} {...listItemMotion}>
              {index === nowIndex && index > 0 && <NowMarker now={now} />}
              <h2 className="flex items-center justify-between border-b border-border bg-sunken px-3 py-1.5 text-xs font-medium text-muted-foreground tabular-nums">
                {group.label}
                <span className="font-normal">
                  {group.items.length} {group.items.length === 1 ? 'booking' : 'bookings'}
                </span>
              </h2>
              <ul className="divide-y divide-border">
                <AnimatePresence initial={false} mode="popLayout">
                  {group.items.map((reservation) => (
                    <motion.li key={reservation.id} {...listItemMotion}>
                      <ReservationRow
                        reservation={reservation}
                        now={now}
                        onReschedule={onReschedule}
                        onEdit={onEdit}
                        onCancel={onCancel}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  )
}

function NowMarker({ now }: { now: Date }) {
  return (
    <div
      role="separator"
      aria-label={`Now, ${formatTime(now)}`}
      className="flex items-center gap-2 border-b border-border px-3 py-1 text-xs font-medium tabular-nums"
    >
      <span aria-hidden="true">Now {formatTime(now)}</span>
      <span className="h-px flex-1 bg-foreground/40" aria-hidden="true" />
    </div>
  )
}
